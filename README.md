# Modos Furniture Customizer

## Overview
The goal of this application is to enable a user to customize, preview, and purchase custom Modos furniture pieces in a Shopify storefront.  This code accomplishes this task by essentially acting as a middleman, and facilitating communication between a 3D model, some user input, and Shopify's API.  This code also has a middleman within itself, as it includes a Sinatra backend hosted on Heroku to hide the store's API key and securely pass information between the application's frontend and Shopify's API.

## Tools/technology used
- Rhino/Grasshopper/ShapeDiver
- Sass/SCSS
- JavaScript
    - jQuery
    - Handlebars.js
- Sinatra/Ruby
    - json
    - sinatra/cross_origin
    - Pony
    - RestClient
- Shopify API
    - REST Admin API
    - Ajax API
- Heroku
    - SendGrid

## How it works
- **Customization**
- The user loads a page with an embedded ShapeDiver iframe.
- A JavaScript file/script elsewhere on the page makes postMessage calls to the ShapeDiver iframe and listens for any responses from the iframe.
- The JavaScript file/script creates input elements based on information from the iframe.  It also attaches event listeners to these input elements so they can communicate with and manipulate the Rhino/Grasshopper/ShapeDiver model.
- The JavaScript file/script also gets additional information (price, number of visible columns) from the ShapeDiver iframe and displays it on the page.


- **Product Creation**
- When the user is finished customizing their product, they can choose to either purchase it or save it.  In either case, the user will be prompted for a name/title for their product and their email address.
- After the user submits the form, screenshot and download link information is requested from the iframe and the customizer's getInfo function is called.  
- After all of the relevant information is assembled, the data is passed to the Sinatra/Ruby backend/API hosted on Heroku.
- The backend uses RestClient to pass the product data to Shopify's API and Pony to send an email to user. It then returns the newly created product's id and URL.
- If the user chose to purchase the product, the default app.js product form submission function is called.


- **Confirmation**
- If the user chose to save the product, a panel with some save confirmation information will be shown.
- Otherwise the product will be added to the user's cart and the cart's contents should appear.


- **Contact Form**
- The user can also choose to contact Modos Furniture through the customizer.
- After clicking a link below the customizer form, the contact panel is shown.
- On submission, the contact panel does some minor input validation and passes the information to the backend hosted on Heroku.
- The backend then sends the appropriate email(s) to Modos Furniture and, if the user chose to receive a copy, to the user.


## How to install/port over to a different storefront
- **Git**
- Download and install Git (and maybe Atom too).
- Clone this repository.


- **Shopify**
- Find and modify the theme's code and assets.
    - Upload all of the image, CSS, SCSS, JS files, except the `customizer-app-js-snippet.js` file, to the theme's assets. You should upload the files themselves, not their folders.
    - In the Shopify UI, rename `customizer-init.js` to `customizer-init.js.liquid` and `templates.js` to `handlebars-templates.js`.
    - Find the theme's `app.js `file. Replace the `product_form` submit event listener with the code in `customizer-app-js-snippet.js` and save it.
    - Create a new template. Select `product` as the type and name it `customizer`. Copy the code in `customizer-product.html` into the new file and replace the code in that file and that file only. Save this file.
    - Create a new snippet and name it `customizer-form`. Copy the code from `customizer-form.html` into this new snippet file and save it.
- Find and modify the store's notification settings
    - Find the new order notification template that is sent to notification subscribers when a customer places an order.
    - Copy and paste the contents of `admin-order-notification.html` into this template and save it.
- Create an API key
    - Find the manage private apps page and create a new private app.
    - Give this app both read and write access for product information and customer information.
    - Name the app whatever you want and save the app.
- Create a new product page
    - Create a new product, set the theme template to `product.customizer`. Give the new product a relevant name and save the product.
    - Create a new collection and name it `All`. Set the collection type to `Automated` and the `products must match` setting to `all conditions`. Create a new condition where the product type is not equal to `Custom`. Save this new collection.


- **Heroku**
- Create a Heroku account, if you don't already have one.
- Either ask the current owner of the Heroku repository to give you access to/control of the repository or do the following:
    - Check if the the SendGrid add-on is installed.  If SendGrid is not installed, install it.
    - Create a `.env` file within the `backend-heroku-app` folder.
    - Copy the following code into the `.env` file.
    ```
    SHOPIFY_API_KEY = --API-KEY--:--API-PASSWORD--
    SHOPIFY_HOSTNAME = --STORENAME--.myshopify.com
    MY_APP_PASSWORD = --PASSWORD--
    ```
    - Go to the Shopify page for the private app you just created.  Replace `--API-KEY--` with the app's API key and `--API-PASSWORD--`with the app's API password.  Make sure the colon remains between these two elements.
    - Replace `--STORENAME--` with the store's permanent name/subdomain.
    - Replace `--PASSWORD--` with whatever password you want.
    - Find the `Config Vars` section in the Heroku app.  Add the variables from the `.env` to the `Config Vars`, with each line as a key-value pair.

## How to update to a new Grasshopper/ShapeDiver model
- Upload your Grasshopper model to ShapeDiver.
- Edit the settings, input names, and input order to match the last used ShapeDiver model.
- In `customizer-product.html`, update the model name in the iframe URL to the new model's name.
- Copy and paste the contents of `customizer-product.html` into the corresponding Shopify file.

## How to define defaults
- Copy the following code into the HTML description (not the regular description) of the customizer's project page:
``` HTML
<div id="input-defs">
    { "Height": {"min": 20, "max": 40, "default": 30, "visibleName": "Height"},
      "Width": {"min": 16, "max": 40, "default": 34, "visibleName": "Width"},
      "Depth": {"min": 12, "max": 18, "default": 16, "visibleName": "Depth"},
      "Columns": {"default": 3, "visibleName": "Columns", "hidden": true},
      "Rows": {"default": 5, "visibleName": "Rows", "hidden": true} }
</div>
```
- Adjust the values in the code snippet as necessary.

## To-dos & known issues
- **Code cleanup - general**
- Convert CSS classes to BEM and remove all IDs.
- Convert CSS file(s) to SCSS.
- Possibly move remaining JavaScript HTML into templates.
- Remove global variables and functions and move them into `customizer` object. Possibly convert into/create `Customizer` class.
- Minify & combine files. (I tried to do this with `Webpack` and `UglifyJS`, but it required too much reworking.)
- Possibly select and implement a design pattern or framework.
- Add function comments.


- **Code cleanup - minor**
- Move `modifiedAddToCart` function back inside event listener.
- Create function for extracting `setParameterValues` arguments, particularly in the `setUpInputs` and `linkedInputs` functions.
- Add checks for whether or not to extract/send `setParameterValues` arguments in the `setUpInputs` function.
- Add checks for whether or not to trigger specific multicol sliders when resetting.
- Add general function for panel changing.
- Possibly add dynamically generated panel content and have only one side panel.
- Remove default-setting text from description.


- **UI improvements**
- Blur or hide multicol toggle, reset, and slider track when there's only one column.
- Improve row numbering, particularly when there's only one column.
- Align multicol track width with model dimension lines.
- Product creation can sometimes take a while. Possibly fade `Creating product` message into `Putting on finishing touches` after several seconds or add a loading bar.
- Fix vertical line spacing in product creation email.
- Increase button size in email.


- **Error handling & messaging**
- Check for errors when loading the page.
- Possibly add timed refresh/contact us suggestion if the customizer takes too long to load.
- Add product creation panel input validation (HTML and/or JS).
    - Project name: alphanumeric characters and spaces only; &le; 20 letters
    - Customer name: alphabetic characters only
    - Email: has @ & period; alphanumeric otherwise
- Disable duplicate product creation.
- Disable multicol sliders when creation panel is visible.
- Check params being passed to Heroku.
    - Check if necessary params exists.
    - Check param data types.
    - Check if numbers are non-zero and non-negative.
    - Check if data is successfully passed to Shopify.
    - Return error codes/messages if necessary.
    - Add reset/place to display error codes returned from backend.


- **Known bugs**
- Resetting multicol sliders sometimes blanks out the price without getting a new price.
- Sometimes screenshots are blank.
- Screenshots sometimes load a bit slowly.
- Can send multiple creation requests when hitting enter repeatedly (might be fixed; haven't tested recently)


- **Additional features**
- Responsive/mobile-friendly customizer layout.
- Add inventory management.
- Add draggable/modifiable 2D version of model.
- Create custom product page template for created products.
    - Add edit product functionality.
    - Improve picture alignment.
    - Add contact us link or module.
- Add share buttons/links to product creation email.
- Add share buttons/links to save confirmation panel.
- Hide customizer price in product listing.
- Automate custom product cleanup/deletion (already have an API set up in the backend; probably just need to hook it up to a scheduler plugin in Heroku or something)
- Add/enable dimensions/measurements toggle.
- Add/enable privacy policy link.
- Double click to type price.
- Add dimensions as line items in cart.
- Add reCaptcha.

## Support
- Google is your friend.
- Good luck! -Peggy
