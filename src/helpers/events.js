const async = require('async');
const ADODB = require('node-adodb');
const _ = require('lodash');
const fse = require('fs-extra');
const FormData = require('form-data');

const { NODE_ENV } = process.env;
const production = NODE_ENV === 'production';

if (require.main.filename.indexOf('app.asar') !== -1) {
  ADODB.PATH = './resources/adodb.js';
}

const events = {
  profitmaker: async ({ store, axios }) => {
    try {
      const config = store.get('config');

      // Parse Data
      const connection = ADODB.open(
        `Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${config.path};`,
      );
      const res = await async.auto({
        batches: async () => {
          const cols = [
            'RndId',
            'ProdId',
            'Packing',
            'SaleSchQty',
            'SaleSchFree',
            'BatchNo',
            'ExpMonth',
            'ExpYear',
            'Qty',
            'Mrp',
            'BillPrice',
            'SaleGst',
          ];
          const colsString = cols.join(', ');
          const query = `SELECT ${colsString} FROM Batch WHERE Qty > 0 AND ExpMonth >= 0 AND ExpYear > 2021;`;
          const data = await connection.query(query);
          const grouped = _.groupBy(data, 'ProdId');
          return grouped;
        },
        products: [
          'batches',
          async ({ batches }) => {
            const cols = [
              'RndId',
              'CatId',
              'ComId',
              'DrugId',
              'Name',
              'Packing',
              'HsnCode',
            ];
            const colsString = cols.join(', ');
            const products = Object.keys(batches);
            const prodsString = `${products.join(',')}`;
            const query = `SELECT ${colsString} FROM Product WHERE RndId IN (${prodsString})`;
            const data = await connection.query(query);
            return data;
          },
        ],
        categories: [
          'products',
          async ({ products }) => {
            const categories = _.uniq(products.map((x) => x.CatId));
            const catsString = `${categories.join(',')}`;
            const query = `SELECT * FROM ProdCat WHERE RndId IN (${catsString})`;
            const data = await connection.query(query);
            return data;
          },
        ],
        companies: [
          'products',
          async ({ products }) => {
            const cols = ['RndId', 'Name'];
            const colsString = cols.join(', ');
            const companies = _.uniq(products.map((x) => x.ComId));
            const comsString = `${companies.join(',')}`;
            const query = `SELECT ${colsString} FROM Company WHERE RndId IN (${comsString})`;
            const data = await connection.query(query);
            return data;
          },
        ],
      });

      // Format Data
      const products = [];
      Object.keys(res.batches).forEach((ProdId) => {
        const data = {
          ProdId,
          batches: res.batches[ProdId],
        };

        const product = res.products.find(
          (x) => x.RndId === parseInt(ProdId, 10),
        );
        data.product = product;
        if (product.CatId) {
          const category = res.categories.find(
            (x) => x.RndId === product.CatId,
          );
          data.category = category;
        }
        if (product.ComId) {
          const company = res.companies.find((x) => x.RndId === product.ComId);
          data.company = company;

          // Only push products if it has company
          products.push(data);
        }
      });

      // Send Data
      const software = store.get('software');
      const reqData = {
        software,
        data: products,
      };

      const appData = store.get('appData');
      const fileName = `${appData}/data-${Date.now()}.json`;
      if (!production) await fse.writeJson(fileName, reqData, { spaces: 2 });

      const form = new FormData();
      form.append('file', fse.createReadStream(fileName));
      await axios.post('', form, {
        headers: { ...form.getHeaders() },
      });

      store.set('lastEvent', { ...reqData, date: Date.now() });
    } catch (err) {
      store.set('lastEvent', { err });
    }
  },
};

const handleEvents = async ({ store, axios }) => {
  const software = store.get('software');
  if (events[software]) return events[software]({ store, axios });

  return console.log('Software not supported');
};

module.exports = handleEvents;
