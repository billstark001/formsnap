/** Information extracted from a single form field. */
export interface FieldLabelInfo {
  text: string;
  source:
    | "explicit-label"
    | "wrapped-label"
    | "aria-label"
    | "aria-labelledby"
    | "accessible-name"
    | "placeholder"
    | "title"
    | "table-header"
    | "fieldset-legend"
    | "nearby-text"
    | "name-id-token"
    | "repeated-group"
    | "heuristic-rule"
    | "unknown";
  confidence: number;
  evidence: string[];
}

export interface FieldSemanticInfo {
  slot: string;
  confidence: number;
  representation?: string;
  evidence: string[];
  ruleIds?: string[];
}

export interface FieldIdentityInfo {
  stableKey: string;
  weakKey?: string;
  formKey?: string;
  structuralPath?: string;
  sources?: StableIdentitySource[];
  selectorReliability: number;
  idReliability?: number;
  nameReliability?: number;
  evidence: string[];
}

export type StableIdentitySourceKind =
  | "stable-key"
  | "form-key"
  | "tag-type"
  | "semantic"
  | "label"
  | "repeat-column"
  | "name-token"
  | "id-token"
  | "structural-path"
  | "autocomplete"
  | "option-text"
  | "naive-id";

/** Compact encoded identity fact: one source-kind code plus a stable value hash. */
export type StableIdentitySource = string;

export type IdentityMatchPresetName = "strict" | "balanced" | "loose";

export interface IdentityMatchPreset {
  /**
   * Minimum shared source facts required for the identity-source shortcut.
   * This replaces the old single stableKey equality shortcut.
   */
  minimumSourceMatches: number;
  score: number;
}

export interface RepeatGroupInfo {
  groupKey: string;
  itemIndex: number;
  fieldIndex: number;
  rowIndex?: number;
  colIndex?: number;
  roleInGroup?: string;
  groupLabel?: string;
  confidence: number;
}

export interface FieldInfo {
  selector: string;
  tag: string;
  type?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  visible: boolean;
  // select (single)
  value?: string;
  selectedText?: string;
  options?: Array<{ value: string; text: string }>;
  // select (multiple)
  multiple?: boolean;
  selectedValues?: Array<{ value: string; text: string }>;
  // checkbox / radio
  checked?: boolean;
  groupSelectedValue?: string | null;
  label?: FieldLabelInfo;
  semantic?: FieldSemanticInfo;
  identity?: FieldIdentityInfo;
  repeat?: RepeatGroupInfo;
  aliases?: string[];
  debug?: Record<string, unknown>;
}

export interface FormSignature {
  key: string;
  url?: string;
  host?: string;
  pathname?: string;
  formSelector?: string;
  action?: string;
  method?: string;
  titleText?: string;
  submitTexts?: string[];
  fieldCount: number;
  fieldTypeSequence: string[];
  fieldSemanticSequence?: string[];
  structureHash: string;
  textHash?: string;
  evidence: string[];
}

export interface FormSnapshot {
  version: 2;
  createdAt: string;
  form?: FormSignature;
  fields: FieldInfo[];
  rulesVersion?: string;
}

export interface PortableSnapshotFieldSource {
  selector?: string;
  name?: string;
  id?: string;
  label?: string;
  semantic?: string;
}

export interface PortableSnapshotField {
  stableId: string;
  identitySources: StableIdentitySource[];
  naiveId?: string;
  description?: string;
  type: string;
  value?: string;
  selectedText?: string;
  selectedValues?: Array<{ value: string; text: string }>;
  checked?: boolean;
  groupSelectedValue?: string | null;
  source?: PortableSnapshotFieldSource;
}

export interface PortableFormSnapshot {
  version: 3;
  createdAt: string;
  form?: Pick<FormSignature, "key" | "fieldCount" | "url" | "host" | "pathname" | "titleText">;
  fields: PortableSnapshotField[];
}

export interface PortableSnapshotCaptureOptions {
  naiveId?: boolean;
  description?: boolean;
  source?: boolean;
}

export type SnapshotTextFormat = "json" | "yaml";
export type SnapshotTextInputFormat = SnapshotTextFormat | "auto";

/** Options for collecting form fields. */
export interface CollectOptions {
  /** Include hidden fields (type=hidden, display:none, visibility:hidden). Default: false */
  includeHidden?: boolean;
  /** Include disabled or readonly fields. Default: false */
  includeDisabled?: boolean;
  /** Include button-type inputs (button/submit/reset/image). Default: false */
  includeButtons?: boolean;
  /** Include fields with empty values. Default: false */
  includeEmpty?: boolean;
  /** Collect full options list for select elements (useful for AI context, not needed for restoration). Default: false */
  includeOptions?: boolean;
}

export interface AnalyzeOptions extends CollectOptions {
  analyzeLabels?: boolean;
  analyzeSemantics?: boolean;
  analyzeRepeats?: boolean;
  includeDebug?: boolean;
  url?: string;
  rules?: HeuristicRuleSet;
}

/** Options for filling form fields. */
export interface FillOptions {
  /** Fire input/change events after filling (for React/Vue reactivity). Default: true */
  fireEvents?: boolean;
  /** Fall back to name→id matching when selector fails. Default: true */
  fallbackMatch?: boolean;
  /** Fill readonly fields. Default: false */
  fillReadonly?: boolean;
  /** Fill disabled fields. Default: false */
  fillDisabled?: boolean;
}

export interface RestoreOptions extends FillOptions {
  matchStrategy?: "selector-first" | "stable-first" | "semantic-first";
  minMatchConfidence?: number;
  allowWeakMatches?: boolean;
  identityMatchPreset?: IdentityMatchPresetName;
  identityMatch?: Partial<IdentityMatchPreset>;
  dryRun?: boolean;
}

/** Result of a fill operation for one field. */
export interface FillResult {
  selector: string;
  status: "ok" | "skip" | "fail";
  reason?: string;
  targetSelector?: string;
  matchConfidence?: number;
  matchStrategy?: string;
}

export interface FieldMatch {
  source: FieldInfo;
  target: FieldInfo;
  confidence: number;
  strategy: string;
  evidence: string[];
}

export interface RestorePlan {
  matches: FieldMatch[];
  unmatchedSource: FieldInfo[];
  unmatchedTarget: FieldInfo[];
  warnings: string[];
}

export interface HeuristicRuleSet {
  version: string;
  updatedAt?: string;
  rules: HeuristicRule[];
}

export type HeuristicRuleScope = "global" | "site" | "form" | "component";

export interface HeuristicRule {
  id: string;
  version?: number;
  scope: HeuristicRuleScope;
  priority?: number;
  confidence?: number;
  match: HeuristicRuleMatcher;
  action: HeuristicRuleAction;
  notes?: string;
}

export interface HeuristicRuleMatcher {
  host?: string | RegExpLike;
  pathname?: string | RegExpLike;
  selector?: string;
  tag?: string;
  type?: string;
  name?: string | RegExpLike;
  id?: string | RegExpLike;
  label?: string | RegExpLike;
  placeholder?: string | RegExpLike;
  autocomplete?: string | RegExpLike;
  text?: string | RegExpLike;
  attributes?: Record<string, string | RegExpLike>;
  ancestorText?: string | RegExpLike;
  repeat?: {
    colIndex?: number;
    fieldIndex?: number;
    groupLabel?: string | RegExpLike;
  };
}

export interface RegExpLike {
  pattern: string;
  flags?: string;
}

export interface HeuristicRuleAction {
  semanticSlot?: string;
  label?: string;
  representation?: string;
  adapter?: string;
  stableKeyHint?: string;
}

export interface RuleContext {
  url?: string;
  host?: string;
  pathname?: string;
  element?: Element;
  root?: Document | Element;
  form?: FormSignature;
}

export interface FieldContext extends RuleContext {
  fields?: FieldInfo[];
  index?: number;
  formKey?: string;
}

export interface StableSelectorOptions {
  preferName?: boolean;
}

export interface FieldAdapter {
  id: string;
  detect(el: Element, info: FieldInfo): boolean;
  read?(el: Element): unknown;
  write?(el: Element, value: unknown, info: FieldInfo): boolean | Promise<boolean>;
}
