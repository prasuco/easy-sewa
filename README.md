# easy-sewa: making esewa v2 payment easier.

## Installation 
```bash
npm install @prasuco/easy-sewa 
```

## Usage

### Importing 
```js 
import { EasySewa} from '@prasuco/easy-sewa';
```
 
### Instantiating
```js 
const easySewa = new EasySewa({
    environment: "development",
    failure_url: "http://localhost:3000/failure",
    success_url: "http://localhost:3000/success",
    product_code: "EPAYTEST",
    secret: "8gBm/:&EnhH.1/q"
})
```


### Payment
```js 
easySewa.pay({ amount: 200, transaction_uuid: "use your own uuid from uuidv4" })
```

> This package has not been tested in production using the production merchant codes of esewa.
