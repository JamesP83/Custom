require 'sinatra'
require 'json'
require 'rest-client'
require 'sinatra/cross_origin'
require 'pony'
require 'dotenv/load'
require 'date'

set :bind, '0.0.0.0'
configure do
  enable :cross_origin
end

before do
  response.headers['Access-Control-Allow-Origin'] = '*'
end

# routes
options "*" do
  response.headers["Allow"] = "GET, POST, OPTIONS"
  response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, X-User-Email, X-Auth-Token"
  response.headers["Access-Control-Allow-Origin"] = "*"
  200
end

before do
  content_type :json
  @shopify_authentication = 'https://' + ENV['SHOPIFY_API_KEY'] + '@' + ENV['SHOPIFY_HOSTNAME']
  @contact_email = 'info@modos.io'
end


Pony.options = {
  via: :smtp,
  via_options: {
    address: 'smtp.sendgrid.net',
    port: '587',
    domain: 'heroku.com',
    user_name: ENV['SENDGRID_USERNAME'],
    password: ENV['SENDGRID_PASSWORD'],
    authentication: :plain,
    enable_starttls_auto: true
  }
}


post '/custom_product' do
  my_product = ({
    product: {
      title: params[:date] + ": " + params[:title],
      body_html: params[:info] + params[:hidden_info],
      vendor: "Modos Furniture",
      product_type: "Custom",
      variants: [{
        option1: "Default Title",
        price: params[:price],
        weight: params[:weight],
        weight_unit: "lb"
      }],
      images: [{
        attachment: params[:image]
      }],
      metafields: [{
	    namespace: "seo",
	    key: "hidden",
	    value: 1,
	    value_type: "integer"
	  }]
    }
  }).to_json

  response = RestClient.post @shopify_authentication + '/admin/products.json', my_product, {content_type: :json, accept: :json}
  created_product = JSON.parse(response.body)["product"]


  my_customer = {
    customer: {
      email: params[:email],
      first_name: params[:first_name],
      last_name: params[:last_name],
      accepts_marketing: params[:accepts_marketing]
    }
  }

  begin
    RestClient.post @shopify_authentication + '/admin/customers.json', my_customer, {content_type: :json, accept: :json}
  rescue RestClient::ExceptionWithResponse
  end


  @product_url = params[:url_base] + created_product["handle"]
  @product_image = created_product["image"]["src"]


  Pony.mail({
    :from => 'Modos Furniture <' + @contact_email + '>',
    :to => params[:email],
    :reply_to => @contact_email,
    :subject => 'Your most recent project, ' + params[:title] + ", from Modos Furniture",
    :html_body => erb(:save_confirmation)
  })

  ({id: created_product["variants"][0]["id"], handle: created_product["handle"]}).to_json
end


delete '/custom_product' do
  days_old = 180
  if (params.has_key?(:password) && params.has_key?(:days_old))
    if params[:password] == ENV['MY_APP_PASSWORD']
      days_old = params[:days_old].to_i
    end
  end

  response = RestClient.get @shopify_authentication + "/admin/products.json?fields=id,published_at&product_type=Custom&published_at_max=" + (Date.today-days_old).to_s
  product_array = JSON.parse(response.body)["products"]
  for product in product_array do
    RestClient.delete @shopify_authentication + "/admin/products/" + product["id"].to_s + ".json"
  end

  ({message: "Deletion successful"}).to_json
end


post '/contact' do
  my_customer = {
    customer: {
      email: params[:email],
      first_name: params[:first_name],
      last_name: params[:last_name]
    }
  }
  begin
    RestClient.post @shopify_authentication + '/admin/customers.json', my_customer, {content_type: :json, accept: :json}
  rescue RestClient::ExceptionWithResponse
  end


  if params[:last_name] == ''
    @customer_name = params[:first_name]
  else
    @customer_name = params[:first_name] + ' ' + params[:last_name]
  end

  Pony.mail({
    :from => 'Modos Furniture <' + @contact_email + '>',
    :to => @contact_email,
    :reply_to => @customer_name + ' <' + params[:customer_email] + '>',
    :subject => 'Customizer inquiry from ' + @customer_name + ' <' + params[:customer_email] + '>',
    :html_body => erb(:contact_form)
  })

  if params[:send_copy] == "true"
    Pony.mail({
      :from => 'Modos Furniture <' + @contact_email + '>',
      :to => params[:customer_email],
      :reply_to => @contact_email,
      :subject => 'A copy of your customizer inquiry',
      :html_body => erb(:message_confirmation)
    })
  end

  return ({message: "Message successfully sent"}).to_json
end

get '/hello' do
  ({message: "Hello!"}).to_json
end
