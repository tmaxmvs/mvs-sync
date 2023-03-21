export interface OriginalAttributes {
  [key: string]: number;
}

export interface NumberedAttributes {
  [key: number]: number;
}

export interface OriginalObject {
  objID: number;
  attributes: OriginalAttributes;
}

export interface NumberedObject {
  objID: number;
  attributes: NumberedAttributes;
}
