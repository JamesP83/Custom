var customizer = {
info: {},

getInfo: function() {
    let product_url = $(".panel--save-confirmation a").prop("href");
    let myIndex = product_url.lastIndexOf("/");
    product_url = product_url.slice(0,myIndex+1);

    let customer_name = $("#customer-name").val();
    let space_index = customer_name.lastIndexOf(" ");
    if (space_index !== -1) {
        var first_name = customer_name.slice(0, space_index);
        var last_name = customer_name.slice(space_index+1);
    }
    else {
        var first_name = customer_name;
        var last_name = "";
    }

    let today = new Date();
    let dateStr = today.getMonth()+1 < 10 ? "0" : "";
    dateStr += today.getMonth()+1 +"/" + today.getDate() + "/" + today.getFullYear().toString().slice(-2);
    Object.assign(this.info, {
        "title": $("#project-title")[0].value,
        "price": parseFloat($(".current_price").text().slice(1)),
        "weight": calculateWeight(),
        "info": getCustomizerInfo(),
        "hidden_info": getCustomizerHiddenInfo(),
        "url_base": product_url,
        "first_name": first_name,
        "last_name": last_name,
        "email": $("#customer-email")[0].value,
        "accepts_marketing": $("#marketing-opt-in")[0].checked,
        "date": dateStr
    });

    if (this.info.hasOwnProperty("image") && this.info.hasOwnProperty("downloadUrl"))
        this.createProduct();
},


createProduct: function() {
    let downloadLink = "<a href=\"" + this.info.downloadUrl + "\">Download model</a>";
    this.info.hidden_info = this.info.hidden_info.slice(0, -6) + downloadLink + "</div>";
    delete this.info.downloadUrl;

    let that = this;

    $.ajax({
        type: "post",
        dataType: "json",
        url: "https://modos.herokuapp.com/custom_product",
        data: this.info,
        success: function(data) {
            that.info = {};
            that.newProductId = data.id;
            let myAction = $(".customizer__form .panel--create button").text().trim();

            if (myAction === "Save") {
                showSaveConfirmation(data);
            } else {
                resetPanelSpinner();
                $(".customizer__form").addClass("customizer__form--add-to-cart")
                    .trigger("submit").removeClass("customizer__form--add-to-cart");
            }
        }
    });
}
};
