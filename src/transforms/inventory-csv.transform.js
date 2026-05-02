import { Transform } from 'node:stream';

class InventoryCsvTransform extends Transform {
  constructor({
    imageUrlBuilder = null,
    convertPriceToUah = false,
    usdToUahRate = 1,
  } = {}) {
    super({ objectMode: true });
    this.imageUrlBuilder = imageUrlBuilder;
    this.convertPriceToUah = convertPriceToUah;
    this.usdToUahRate = usdToUahRate;
  }

  _transform(item, _encoding, callback) {
    try {
      const numericPrice = Number(item?.price);
      const normalizedPrice = Number.isFinite(numericPrice) ? numericPrice : '';
      const row = {
        id: item?.id ?? '',
        name: item?.name ?? '',
        quantity: item?.quantity ?? '',
        price: normalizedPrice,
        category: item?.category ?? '',
        image: this.imageUrlBuilder ? this.imageUrlBuilder(item?.image) ?? '' : '',
      };

      if (this.convertPriceToUah && Number.isFinite(numericPrice)) {
        row.price = Number((numericPrice * this.usdToUahRate).toFixed(2));
      }

      callback(null, row);
    } catch (error) {
      callback(error);
    }
  }
}

export { InventoryCsvTransform };
