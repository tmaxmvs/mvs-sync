import * as ConverterInterface from "../interfaces/AttrInterfaces";

export class Converter {
  convertObjectIdToPrefabID(objectID: number) {
    return objectID & 0xffff0000;
  }

  convertObjectIdToInstanceID(objectID: number) {
    return objectID & 0x0000ffff;
  }

  convertToNumberedAttributes(
    attributes: ConverterInterface.OriginalAttributes
  ): ConverterInterface.NumberedAttributes {
    const attributeKeys = Object.keys(attributes);
    const numberedAttributes: ConverterInterface.NumberedAttributes = {};

    attributeKeys.forEach((key, index) => {
      numberedAttributes[index] =
        attributes[key as keyof ConverterInterface.OriginalAttributes];
    });

    return numberedAttributes;
  }

  convertToNumberedObject(
    originalObject: ConverterInterface.OriginalObject
  ): ConverterInterface.NumberedObject {
    return {
      objID: originalObject.objID,
      attributes: this.convertToNumberedAttributes(originalObject.attributes),
    };
  }
}
