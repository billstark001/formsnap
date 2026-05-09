import { normalizeText, tokenizeIdentifier } from "../shared/text.js";
import type { FieldInfo, FieldSemanticInfo } from "../types.js";

type SlotRule = { slot: string; patterns: RegExp[] };

const SLOT_RULES: SlotRule[] = [
  {
    slot: "email",
    patterns: [/e-?mail|mail address|メール|メールアドレス|邮箱|電子郵件|电子邮件/i],
  },
  {
    slot: "phone.full",
    patterns: [/phone|tel|telephone|mobile|携帯|電話|電話番号|手机|手机号|联系电话/i],
  },
  { slot: "postal_code", patterns: [/postal|zip|postcode|郵便番号|邮编|邮政编码/i] },
  { slot: "address.country", patterns: [/country|国|国家/i] },
  { slot: "address.region", patterns: [/state|region|prefecture|都道府県|省/i] },
  { slot: "address.city", patterns: [/city|市区町村|市|区/i] },
  { slot: "address.street", patterns: [/street|address.?1|番地|街道/i] },
  { slot: "address.building", patterns: [/building|address.?2|建物|ビル|公寓/i] },
  { slot: "address.full", patterns: [/address|住所|地址/i] },
  {
    slot: "date",
    patterns: [/date|dob|birth|birthday|年月|出生日期|生年月日|取得年月|入学年月|卒業年月/i],
  },
  {
    slot: "company",
    patterns: [/company|organization|organisation|employer|会社|会社名|法人|公司/i],
  },
  { slot: "department", patterns: [/school|university|college|高校|学校|学部|学科|学校信息/i] },
  {
    slot: "username",
    patterns: [/actor|badge name|nickname|nick.?name|用户名|昵称|アカウント|account/i],
  },
  {
    slot: "url",
    patterns: [/facebook|linkedin|wantedly|github|twitter|x\.com|social|sns|profile url/i],
  },
  {
    slot: "title",
    patterns: [/badge description|description|self.?intro|signature|签名|自己紹介|志望|理由/i],
  },
  { slot: "name.first", patterns: [/first name|given name|(?:^|[\s:：])名(?:$|[\s:：])/iu] },
  {
    slot: "name.last",
    patterns: [/last name|family name|surname|(?:^|[\s:：])姓(?:$|[\s:：\(（])/iu],
  },
  { slot: "name.full", patterns: [/full name|native name|name|氏名|姓名|お名前/i] },
  { slot: "department", patterns: [/department|部署|部門|部门/i] },
  { slot: "title", patterns: [/title|役職|職位|职位/i] },
  { slot: "url", patterns: [/url|website|homepage|サイト|网址/i] },
  { slot: "username", patterns: [/user.?name|account|login|ユーザー|用户名/i] },
  { slot: "search", patterns: [/search|検索|搜索/i] },
];

const AUTOCOMPLETE: Record<string, string> = {
  email: "email",
  tel: "phone.full",
  "tel-country-code": "phone.country_code",
  "tel-national": "phone.national",
  "tel-area-code": "phone.area_code",
  "postal-code": "postal_code",
  country: "address.country",
  "address-level1": "address.region",
  "address-level2": "address.city",
  "street-address": "address.full",
  "address-line1": "address.street",
  "address-line2": "address.building",
  name: "name.full",
  "given-name": "name.first",
  "family-name": "name.last",
  organization: "company",
  "organization-title": "title",
  username: "username",
};

function fieldText(info: FieldInfo): string {
  return normalizeText(
    [
      info.label?.text,
      info.name,
      info.id,
      info.aliases?.join(" "),
      info.options?.map((o) => o.text).join(" "),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function inferRepresentation(info: FieldInfo, slot: string): string | undefined {
  const type = info.type ?? "";
  const maxLength = info.debug?.maxlength;
  const placeholder = String(info.debug?.placeholder ?? "");
  const nameTokens = tokenizeIdentifier(info.name).join(" ");
  const idTokens = tokenizeIdentifier(info.id).join(" ");
  const all = `${placeholder} ${nameTokens} ${idTokens} ${info.label?.text ?? ""}`;
  if (slot.startsWith("postal_code")) {
    if (slot.endsWith(".part1") || /(?:zip|postal|yubin).*(?:1|part1)/i.test(all))
      return "split_3_4";
    if (slot.endsWith(".part2") || /(?:zip|postal|yubin).*(?:2|part2)/i.test(all))
      return "split_3_4";
    if (maxLength === "7") return "single_7_digits";
    if (/\d{3}-\d{4}/.test(placeholder)) return "single_3_dash_4";
  }
  if (slot.startsWith("phone")) {
    if (type === "tel") return "single";
    if (maxLength === "3" || maxLength === "4") return "split_2_or_3";
  }
  if (slot.startsWith("address")) {
    if (info.tag === "textarea") return "full_textarea";
  }
  return undefined;
}

export function detectSemantic(info: FieldInfo): FieldSemanticInfo {
  const evidence: string[] = [];
  const scores = new Map<string, number>();
  const add = (slot: string, score: number, reason: string) => {
    scores.set(slot, (scores.get(slot) ?? 0) + score);
    evidence.push(`${reason}: ${slot} +${score}`);
  };

  const autocomplete = String(info.debug?.autocomplete ?? "").toLowerCase();
  if (AUTOCOMPLETE[autocomplete]) add(AUTOCOMPLETE[autocomplete], 70, "autocomplete");
  if (info.type === "email") add("email", 80, "type=email");
  if (info.type === "tel") add("phone.full", 65, "type=tel");
  if (info.type === "url") add("url", 70, "type=url");
  if (info.type === "password") add("password", 80, "type=password");
  if (info.type === "number") add("number", 55, "type=number");
  if (info.type === "date") add("date", 65, "type=date");
  if (info.type === "search") add("search", 65, "type=search");

  const text = fieldText(info);
  for (const rule of SLOT_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      add(rule.slot, info.label ? 55 : 35, `text "${text}"`);
    }
  }

  const best = Array.from(scores.entries()).sort((a, b) => b[1] - a[1])[0];
  if (!best) return { slot: "unknown", confidence: 0.1, evidence: ["no semantic rule matched"] };
  const confidence = Math.min(0.99, best[1] / 100);
  return {
    slot: best[0],
    confidence,
    representation: inferRepresentation(info, best[0]),
    evidence,
  };
}

export function applyPostalAndPhoneRepresentations(fields: FieldInfo[]): void {
  for (let i = 0; i < fields.length - 1; i++) {
    const a = fields[i];
    const b = fields[i + 1];
    const label = normalizeText(`${a.label?.text ?? ""} ${b.label?.text ?? ""}`);
    const aMax = a.debug?.maxlength;
    const bMax = b.debug?.maxlength;
    if (/郵便番号|邮编|postal|zip/.test(label) && aMax === "3" && bMax === "4") {
      a.semantic = {
        slot: "postal_code.part1",
        confidence: 0.9,
        representation: "split_3_4",
        evidence: ["adjacent maxlength 3/4 postal fields"],
      };
      b.semantic = {
        slot: "postal_code.part2",
        confidence: 0.9,
        representation: "split_3_4",
        evidence: ["adjacent maxlength 3/4 postal fields"],
      };
    }
    if (
      /電話|phone|tel/.test(label) &&
      (aMax === "2" || aMax === "3") &&
      (bMax === "3" || bMax === "4")
    ) {
      a.semantic = {
        slot: "phone.area_code",
        confidence: 0.75,
        representation: "split_2_or_3",
        evidence: ["adjacent phone maxlength pattern"],
      };
      b.semantic = {
        slot: "phone.national",
        confidence: 0.75,
        representation: "split_2_or_3",
        evidence: ["adjacent phone maxlength pattern"],
      };
    }
  }
}
