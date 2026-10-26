# Novalnet Payment Connector for commercetools

The **Novalnet Payment Connector** is a commercetools Connect application that integrates the Novalnet Payment Gateway with **commercetools Checkout**. It supports direct and redirect payment methods, authorization and payment flows, webhook processing, and automatic synchronization of Payments and Orders throughout the payment lifecycle.

The connector is built using the **commercetools Connect Payment SDK** and follows commercetools Connect deployment standards.

## Features

* Direct and Redirect payment flows
* Credit Card 3D Secure support
* Authorization and Payment modes
* Configurable minimum amount for authorization
* Guaranteed payment eligibility validation
* Optional fallback to non-guaranteed payments
* Webhook processing for major payment events
* English and German transaction comments
* commercetools Connect compatible deployment

## Supported Payment Methods

| Payment Method               | Flow              |
| ---------------------------- | ----------------- |
| Credit Card                  | Direct / Redirect |
| Direct Debit SEPA            | Direct            |
| Guaranteed Direct Debit SEPA | Direct            |
| Direct Debit ACH             | Direct            |
| Invoice                      | Direct            |
| Guaranteed Invoice           | Direct            |
| Prepayment                   | Direct            |
| PayPal                       | Redirect          |
| Online Bank Transfer         | Redirect          |
| Przelewy24                   | Redirect          |
| EPS                          | Redirect          |
| Bancontact                   | Redirect          |
| Multibanco                   | Redirect          |
| Alipay                       | Redirect          |
| WeChat Pay                   | Redirect          |
| Trustly                      | Redirect          |
| TWINT                        | Redirect          |
| PostFinance                  | Redirect          |
| PostFinance Card             | Redirect          |
| MB WAY                       | Redirect          |
| BLIK                         | Redirect          |
| PIX                          | Redirect          |
| Boleto                       | Redirect          |
| Bizum                        | Redirect          |
| BANCOMAT Pay                 | Redirect          |
| Kakao Pay                    | Redirect          |
| Naver Pay                    | Redirect          |


## Project Structure

```
.
├── enabler/
│   ├── src/
│   ├── test/
│   └── README.md
├── processor/
│   ├── src/
│   ├── test/
│   └── README.md
├── connect.yaml
├── docker-compose.yml
└── README.md
```

## Modules

### Enabler

The **Enabler** provides the frontend integration between commercetools Checkout and Novalnet's secure payment components.

Responsibilities include:

* Loading Novalnet payment libraries.
* Rendering secure payment forms.
* Initializing payment methods.
* Collecting payment data securely.
* Communicating with the Processor.

### Processor

The **Processor** is the backend middleware responsible for:

* Creating payments.
* Calling Novalnet APIs.
* Processing redirect callbacks.
* Handling webhooks.
* Updating commercetools Payments.

## Payment Flow

### Connector overview

```mermaid
flowchart TD
    shopper["Shopper"] --> checkout["commercetools Checkout"]
    checkout --> enabler["Novalnet enabler assets"]
    enabler --> processor["Novalnet processor"]
    processor --> gateway["Novalnet API"]
    processor --> commerce["commercetools Payments"]
    checkout --> orders["commercetools Orders"]
    gateway --> callback["Return and webhook events"]
    callback --> processor
    processor --> orders
```

### Direct Payment

Used for payment methods such as Credit Card, SEPA, ACH, Invoice, and Guaranteed payments.

```
Customer
   │
Checkout
   │
Processor
   │
Create Payment
   │
Novalnet Payment/Authorization API
   │
Update Payment
   │
Sync Order & Payment States
```

### Redirect Payment

Used for payment methods such as PayPal, TWINT, Przelewy24, EPS, Bancontact, and other redirect payment methods.

```
Customer
   │
Checkout
   │
Processor
   │
Create Pending Authorization
   │
Redirect to Novalnet
   │
Customer completes payment
   │
Success / Failure Route
   │
Update Payment
   │
Sync Order & Payment States
```

## Authorization Logic

The connector supports both:

* `payment`
* `authorize`

Each payment method can be configured independently.

When **Authorize** is selected, the connector also supports a configurable **minimum amount**.

Example:

| Order Amount | Minimum Amount | Result        |
| ------------ | -------------- | ------------- |
| €50          | €100           | Payment       |
| €120         | €100           | Authorization |

## Guaranteed Payments

Supported methods:

* Guaranteed Invoice
* Guaranteed Direct Debit SEPA

## Webhook Processing

The connector processes the following Novalnet webhook events.

| Event               | Action                              |
| ------------------- | ----------------------------------- |
| PAYMENT             | Initial payment                     |
| TRANSACTION_CAPTURE | Capture                             |
| TRANSACTION_CANCEL  | Cancel                              |
| TRANSACTION_REFUND  | Refund                              |
| CREDIT              | Partial and Full credit             |
| TRANSACTION_UPDATE  | Amount, Due Date and Status updates |
| CHARGEBACK          | Chargeback                          |


## Configuration

Configuration is managed through **commercetools Connect** using `connect.yaml`.

### commercetools Configuration

Required commercetools settings include:

* Project Key
* Client ID
* Client Secret
* Auth URL
* API URL
* Session URL
* JWKS URL
* JWT Issuer

### Novalnet Configuration

Required Novalnet settings include:

* Product Activation Key
* Payment Access Key
* Tariff ID
* Client Key

Each payment method also supports its own configuration for:

* Test Mode
* Payment Action
* Minimum Authorization Amount
* Due Date
* Guaranteed Payment options
* Credit Card 3D Secure settings

Refer to **connect.yaml** for the complete configuration list.

## B2B guarantee and one-click shopping

These optional settings default to `0`; set `1` to enable:

| Configuration | Magento label |
| --- | --- |
| `NOVALNET_GUARANTEED_INVOICE_ALLOW_B2B_CUSTOMERS` | Allow B2B Customers |
| `NOVALNET_GUARANTEED_SEPA_ALLOW_B2B_CUSTOMERS` | Allow B2B Customers |
| `NOVALNET_CREDITCARD_ONE_CLICK_SHOPPING` | One-click shopping |
| `NOVALNET_SEPA_ONE_CLICK_SHOPPING` | One-click shopping |
| `NOVALNET_GUARANTEED_SEPA_ONE_CLICK_SHOPPING` | One-click shopping |

For either guarantee method, an enabled B2B setting and a nonempty Cart `billingAddress.company` hide the DOB field and send that company as `customer.billing.company`; DOB is omitted. The existing guarantee amount, currency, address and fallback conditions remain in force.

One-click shopping is available for registered customers. The unchecked “Save for future purchase” checkbox requests `transaction.create_token=1` only after consent. Successful response tokens are stored privately in commercetools Custom Objects. The authenticated `/paymentFeatures` route returns selection IDs and masked labels, never reusable provider tokens. Reuse sends the resolved token as `transaction.payment_data.token`; it does not require re-entering bank/card details. A guaranteed B2C payment still uses its existing DOB requirement.

The latest three distinct saved cards and latest three distinct SEPA accounts are retained; standard and guaranteed SEPA share accounts when their merchant/test-mode scope matches, as in the Magento reference. “Add new card details” / “Add new account details” shows the original form and consent checkbox. German wording follows the supplied Magento translations. Card tokens returned before 3DS authentication become selectable only after verified successful completion for the same transaction.

The feature uses `nn-saved-payments` and `nn-token-consent` Custom Object containers under the existing processor API credentials. It stores tokens and masked display metadata, not PAN, full IBAN or CVC. Guest checkout and disabled options do not create reusable tokens. Deploy the matching processor and rebuilt enabler assets together. No other connector configuration or dependencies are changed.
