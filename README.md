# connector

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

### Lints and fixes files

```
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

### For ssl handshake problems

```
"options": {
    "cryptoCredentialsDetails": {
        "minVersion": "TLSv1"
    },
    "trustServerCertificate": true,
    "trustedConnection": true
}
```
