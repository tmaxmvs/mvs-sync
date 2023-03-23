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

  convertToOriginalAttributes(
    numberedAttributes: ConverterInterface.NumberedAttributes
  ): ConverterInterface.OriginalAttributes {
    return;
  }

  convertToNumberedObject(
    originalObject: ConverterInterface.OriginalObject
  ): ConverterInterface.NumberedObject {
    return {
      objID: originalObject.objID,
      attributes: this.convertToNumberedAttributes(originalObject.attributes),
    };
  }

  convertToOriginalObject(
    numberedObject: ConverterInterface.NumberedObject
  ): ConverterInterface.OriginalObject {
    return {
      objID: numberedObject.objID,
      attributes: this.convertToOriginalAttributes(numberedObject.attributes),
    };
  }
}
