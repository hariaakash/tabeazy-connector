const async = require('async');
const _ = require('lodash');
const fse = require('fs-extra');
const FormData = require('form-data');
const ADODB = require('node-adodb');
const mssql = require('mssql');
// const moment = require('moment');

if (require.main.filename.indexOf('app.asar') !== -1) {
  ADODB.PATH = './resources/adodb.js';
}

const fields = {
  profitmaker: {
    batch: [
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
      'CostPrice',
      'SaleGst',
    ],
    product: [
      'RndId',
      'CatId',
      'ComId',
      'DrugId',
      'Name',
      'Packing',
      'HsnCode',
    ],
    company: ['RndId', 'Name'],
  },
  metalink: {
    batches: [
      'ProductId',
      'Packing',

      'ExpiryMonth',
      'ExpiryYear',
      'BatchNumber',
      'Quantity',

      'SaleSchemeQty',
      'SaleSchemeFree',

      'RetailerPrice', // sale rate without gst
      'MRP',
      'SchemeInfo',
    ],
    product: [
      'ProductKey',
      'Category',
      'GSTId',

      'Name',
      'SinglePack',
      'Marketer',
      'PFormula',
      'HSN',
    ],
    gst: ['GSTKey', 'GSTPer'],
    productCategory: ['ProdCatKey', 'Name'],
  },
};

const events = {
  profitmaker: async ({ store }) => {
    const config = store.get('config');

    // Connection
    const connection = ADODB.open(
      `Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${config.path};`,
    );

    // Parse Data
    const res = await async.auto({
      batches: async () => {
        const cols = fields.profitmaker.batch;
        const colsString = cols.join(', ');
        // const nextDate = moment().add(7, 'M');
        // const month = nextDate.month();
        // const year = nextDate.year();
        const query = `SELECT ${colsString} FROM Batch WHERE Qty > 0`;
        // const query = `SELECT ${colsString} FROM Batch WHERE Qty > 0 AND ExpMonth > ${month} AND ExpYear >= ${year}`;
        const data = await connection.query(query);
        const grouped = _.groupBy(data, 'ProdId');
        return grouped;
      },
      products: [
        'batches',
        async ({ batches }) => {
          const cols = fields.profitmaker.product;
          const colsString = cols.join(', ');
          const products = Object.keys(batches);
          if (products.length === 0) return [];

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
          if (categories.length === 0) return [];

          const catsString = `${categories.join(',')}`;
          const query = `SELECT * FROM ProdCat WHERE RndId IN (${catsString})`;
          const data = await connection.query(query);
          return data;
        },
      ],
      companies: [
        'products',
        async ({ products }) => {
          const cols = fields.profitmaker.company;
          const colsString = cols.join(', ');
          const companies = _.uniq(products.map((x) => x.ComId));
          if (companies.length === 0) return [];

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
      if (product) {
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
      }
    });

    return products;
  },
  profitmakerServer: async ({ store }) => {
    const config = store.get('config');

    // Connection
    const defaultOpts = {
      options: {
        trustServerCertificate: true,
        trustedConnection: true,
      },
    };
    await mssql.connect({ ..._.merge(defaultOpts, config) });

    // Parse Data
    const res = await async.auto({
      batches: async () => {
        const cols = fields.profitmaker.batch;
        const colsString = cols.join(', ');
        // const nextDate = moment().add(7, 'M');
        // const month = 1 + nextDate.month();
        // const year = nextDate.year();
        const query = `SELECT ${colsString} FROM Batch WHERE Qty > 0`;
        // const query = `SELECT ${colsString} FROM Batch WHERE Qty > 0 AND ExpMonth > ${month} AND ExpYear >= ${year}`;
        const data = await mssql.query(query);
        const grouped = _.groupBy(data.recordset, 'ProdId');
        return grouped;
      },
      products: [
        'batches',
        async ({ batches }) => {
          const cols = fields.profitmaker.product;
          const colsString = cols.join(', ');
          const products = Object.keys(batches);
          if (products.length === 0) return [];

          const prodsString = `${products.join(',')}`;
          const query = `SELECT ${colsString} FROM Product WHERE RndId IN (${prodsString})`;
          const data = await mssql.query(query);
          return data.recordset;
        },
      ],
      categories: [
        'products',
        async ({ products }) => {
          const categories = _.uniq(products.map((x) => x.CatId));
          if (categories.length === 0) return [];

          const catsString = `${categories.join(',')}`;
          const query = `SELECT * FROM ProdCat WHERE RndId IN (${catsString})`;
          const data = await mssql.query(query);
          return data.recordset;
        },
      ],
      companies: [
        'products',
        async ({ products }) => {
          const cols = fields.profitmaker.company;
          const colsString = cols.join(', ');
          const companies = _.uniq(products.map((x) => x.ComId));
          if (companies.length === 0) return [];

          const comsString = `${companies.join(',')}`;
          const query = `SELECT ${colsString} FROM Company WHERE RndId IN (${comsString})`;
          const data = await mssql.query(query);
          return data.recordset;
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
      if (product) {
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
      }
    });
    return products;
  },
  metalink: async ({ store }) => {
    const config = store.get('config');

    // Connection
    const defaultOpts = {
      options: {
        trustServerCertificate: true,
        trustedConnection: true,
      },
    };
    await mssql.connect({ ..._.merge(defaultOpts, config) });

    // Parse Data
    const res = await async.auto({
      batches: async () => {
        const cols = fields.metalink.batches;
        const colsString = cols.join(', ');
        // const nextDate = moment().add(7, 'M');
        // const month = 1 + nextDate.month();
        // const year = nextDate.year();
        const query = `SELECT ${colsString} FROM Batches WHERE Quantity > 0`;
        // const query = `SELECT ${colsString} FROM Batches WHERE Quantity > 0 AND ExpiryMonth > ${month} AND ExpiryYear >= ${year}`;
        const data = await mssql.query(query);
        const grouped = _.groupBy(data.recordset, 'ProductId');
        return grouped;
      },
      products: [
        'batches',
        async ({ batches }) => {
          const cols = fields.metalink.product;
          const colsString = cols.join(', ');
          const products = Object.keys(batches);
          if (products.length === 0) return [];

          const prodsString = `${products.join(',')}`;
          const query = `SELECT ${colsString} FROM Product WHERE ProductKey IN (${prodsString})`;
          const data = await mssql.query(query);
          return data.recordset;
        },
      ],
      categories: [
        'products',
        async ({ products }) => {
          const cols = fields.metalink.productCategory;
          const colsString = cols.join(', ');
          const categories = _.uniq(products.map((x) => x.Category));
          if (categories.length === 0) return [];

          const catsString = `${categories.join(',')}`;
          const query = `SELECT ${colsString} FROM ProductCategory WHERE ProdCatKey IN (${catsString})`;
          const data = await mssql.query(query);
          return data.recordset;
        },
      ],
      gst: [
        'products',
        async ({ products }) => {
          const cols = fields.metalink.gst;
          const colsString = cols.join(', ');
          const gsts = _.uniq(products.map((x) => x.GSTId));
          if (gsts.length === 0) return [];

          const gstString = `${gsts.join(',')}`;
          const query = `SELECT ${colsString} FROM GST WHERE GSTKey IN (${gstString})`;
          const data = await mssql.query(query);
          return data.recordset;
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
        (x) => x.ProductKey === parseInt(ProdId, 10),
      );
      if (product) {
        data.product = product;
        if (product.Category) {
          const category = res.categories.find(
            (x) => x.ProdCatKey === product.Category,
          );
          data.category = category;
        }
        if (product.GSTId) {
          const gst = res.gst.find((x) => x.GSTKey === product.GSTId);
          data.gst = gst;
        }

        products.push(data);
      }
    });
    return products;
  },
};

const handleEvents = async ({ store, axios }) => {
  try {
    const software = store.get('software');

    // Process Data
    if (!events[software]) return console.log('Software not supported');
    const data = await events[software]({ store });

    // Send Data
    const reqData = { software, data };

    const appData = store.get('appData');
    const fileName = `${appData}/data.json`;
    await fse.writeJson(fileName, reqData, { spaces: 2 });

    const form = new FormData();
    form.append('file', fse.createReadStream(fileName));
    await axios.post('', form, {
      headers: { ...form.getHeaders() },
    });

    return store.set('lastEvent', { ...reqData, date: Date.now() });
  } catch (err) {
    console.log(err);
    return store.set('lastEvent', { err });
  }
};

module.exports = handleEvents;
