const express = require('express');
const serveStatic = require('serve-static');
const https = require('follow-redirects').https;
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const privateKey = fs.readFileSync('ca/privatekeys/localhost.key', 'utf8');
const certificate = fs.readFileSync('ca/certs/localhost.crt', 'utf8');
const credentials = {key: privateKey, cert: certificate};

const app = express();
app.use(bodyParser.json());
const port = process.env.PORT || 4444;

const queryBuilder = (queries1) => {
  let params = '';
  for (const query in queries1) {
    params = params + query + '=' + encodeURIComponent(queries1[query]) + '&';
  }
  if (params.length > 1) {
    params = params.substring(0, params.length - 1);
  }
  return '?' + params;
};


const requestBuilder = (param1, param2, param3, param4, param5, queries) => {
  let myqueries = queryBuilder(queries);
  let query;
  if (myqueries.length > 1) {
    query = myqueries;
  } else {
    query = '';
  }

  if (
    param1.length > 1 &&
    param2.length > 1 &&
    param3.length > 1 &&
    param4.length > 1 &&
    param5.length > 1
  ) {
    return (
      '/api/' +
      param1 +
      '/' +
      param2 +
      '/' +
      param3 +
      '/' +
      param4 +
      '/' +
      param5 +
      query
    );
  } else if (
    param1.length > 1 &&
    param2.length > 1 &&
    param3.length > 1 &&
    param4.length > 1 &&
    param5.length === 1
  ) {
    return (
      '/api/' + param1 + '/' + param2 + '/' + param3 + '/' + param4 + query
    );
  } else if (
    param1.length > 1 &&
    param2.length > 1 &&
    param3.length > 1 &&
    param4.length === 1 &&
    param5.length === 1
  ) {
    return '/api/' + param1 + '/' + param2 + '/' + param3 + query;
  } else if (
    param1.length > 1 &&
    param2.length === 1 &&
    param3.length === 1 &&
    param4.length === 1 &&
    param5.length === 1
  ) {
    return '/api/' + param1 + '/' + param2 + query;
  }
};

app.get('/wsoneapi', async (req, res0) => {
  const {authorization, domain, param1, param2, param3, param4, param5} = req.headers;
  const awtenantcode = req.headers['aw-tenant-code'];
  if (!authorization) {
    console.log('error: You are not authorized!');
    return res0.status(401).send({error: 'You are not authorized!'});
  } else if (!domain) {
    return res0.status(400).send({
      error: 'You forgot to include the environment domain name!',
    });
  }

  let options = {
    method: 'GET',
    hostname: domain,
    path: requestBuilder(param1, param2, param3, param4, param5, req.query),
    headers: {
      Authorization: authorization,
      'aw-tenant-code': awtenantcode,
      Accept: 'application/json;version=2;',
      Cookie: '__cfduid=deed201afd27e50d8dc45ea9a40b913f91587694655'
    },
    maxRedirects: 20
  };
  https
    .request(options, function (res) {
      const chunks = [];
      const ip = (req.headers['x-forwarded-for'] || '').split(',').pop().trim() ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

      console.log(ip + ' ' + options.hostname + options.path);

      res.on('data', function (chunk) {
        chunks.push(chunk);
      });

      res.on('end', function () {
        const body = Buffer.concat(chunks);
        res0.send(body);
      });

      res.on('error', function (error) {
        console.error(error);
      });
    }).end();

});

app.use(serveStatic(path.join(__dirname, 'www'), {'index': ['index.html']}));

var httpsServer = https.createServer(credentials, app);
httpsServer.listen(port, () =>{
  console.log('Listening on https://localhost:' + port + '/');
});
