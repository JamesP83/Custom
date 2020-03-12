/*** BEGIN MODIFIED CODE ***/
{% if settings.cart_action == 'ajax' %}
  $(".product_form").submit(function(e) {
    e.preventDefault();
    var $addToCartForm = $(this);

    if ($addToCartForm.hasClass("customizer__form--add-to-cart"))
      modifiedAddToCart($addToCartForm, {"quantity": 1, "id": customizer.newProductId});
    else if (!$addToCartForm.hasClass("customizer__form"))
      modifiedAddToCart($addToCartForm, $addToCartForm.serialize());
    return false;
  });

  function modifiedAddToCart($addToCartForm, myData) {
    var $addToCartBtn = $addToCartForm.find('.add_to_cart');

    $.ajax({
      url: '/cart/add.js',
      dataType: 'json',
      type: 'post',
      data: myData,
      beforeSend: function() {
        $addToCartBtn.attr('disabled', 'disabled').addClass('disabled');
        $addToCartBtn.find('span').removeClass("zoomIn").addClass('animated zoomOut');
      },
      success: function(itemData) {
        $addToCartBtn.find('span').text({{ 'products.product.add_to_cart_success' | t | json }}).removeClass('zoomOut').addClass('fadeIn');

        window.setTimeout(function(){
          $addToCartBtn.removeAttr('disabled').removeClass('disabled in-progress');
          $addToCartBtn.find('span').addClass("fadeOut").text($addToCartBtn.data('label')).removeClass('fadeIn').removeClass("fadeOut").addClass('zoomIn');
        }, 1000);

        $.getJSON("/cart.js", function(cart) {
          refreshCart(cart);
          window.setTimeout(function(){ $.fancybox.close(); $('.cart-button').click(); }, 500);
        });
      },
      error: function(XMLHttpRequest) {
        var response = eval('(' + XMLHttpRequest.responseText + ')');
        response = response.description;
        $('.warning').remove();

        var warning = '<p class="warning animated bounceIn">' + response.replace('All 1 ', 'All ') + '</p>';
        $addToCartForm.after(warning);
        $addToCartBtn.removeAttr('disabled').removeClass('disabled');
        $addToCartBtn.find('span').text({{ 'products.product.add_to_cart' | t | json }}).removeClass('zoomOut').addClass('zoomIn');
      }
    });
  }
{% endif %}
/*** END MODIFIED CODE ***/
