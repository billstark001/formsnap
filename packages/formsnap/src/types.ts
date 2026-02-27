/** Information extracted from a single form field. */
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
}

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

/** Result of a fill operation for one field. */
export interface FillResult {
  selector: string;
  status: "ok" | "skip" | "fail";
  reason?: string;
}
