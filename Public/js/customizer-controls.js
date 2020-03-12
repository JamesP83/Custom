// Gets parameter infomrmation from the model once the iframe loads
// A later function will create controls from this information
$('#sd-iframe').on('load', function() {
   payload = {command: "getParameterDefinitions"};
   this.contentWindow.postMessage(payload, "https://www.shapediver.com");
   $.get("https://modos.herokuapp.com/hello");
});


// Listens for incoming messages from the viewer
$(window).on("message", receiveMessage);


var modelInfo = {};
var customizerScreenshot = "";
var params = {};
var exportId = "";

// Main function: inteprets messages from the viewer/model and acts accordingly
function receiveMessage(event) {
    //security stuff
    var origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.
    if (origin != "https://www.shapediver.com" && origin != "https://local.shapediver.com")
        return;

    var data = event.data || event.originalEvent.data;
    var source = event.source || event.originalEvent.source;

    //var time = new Date(Date.now());
    //console.log(time.getSeconds() + "." + time.getMilliseconds());
    //console.log(data);
    if (data.hasOwnProperty("viewerMessage")) {
        if (data.viewerMessage == "GeometryUpdateDone")
            source.postMessage({command: "getModelData"}, origin);
        else if (data.viewerMessage == "InitialSceneReady")
            removeLoadingScreen();
    }
    else if (data.hasOwnProperty("command") && data.hasOwnProperty("result")) {
        var commandName = data.command;
        var result = data.result;

        switch (commandName) {
            case "getParameterDefinitions":
                if (customizer.hasOwnProperty("init")) {
                    customizer.init.createInputs(result, source);
                    delete customizer.init.createInputs;
                    source.postMessage({command: "getExportDefinitions"}, origin);
                }
                break;
            case "getExportDefinitions":
                for (let i = 0; i < result.length; i++)
                    if (result[i].type === "download") {
                        exportId = result[i].id;
                        break;
                    }
                break;
            case "getScreenshot":
                let commaIndex = result.indexOf(",");
                customizer.info.image = result.slice(commaIndex+1);
                if (customizer.info.hasOwnProperty("downloadUrl") && customizer.info.hasOwnProperty("title"))
                    customizer.createProduct();
                break;
            case "requestExport":
                customizer.info.downloadUrl = result.href;
                if (customizer.info.hasOwnProperty("image") && customizer.info.hasOwnProperty("title"))
                    customizer.createProduct();
                break;
            case "getModelData":
                if ($.isEmptyObject(result)) {
                    source.postMessage({command: "getModelData"}, origin);
                    return;
                }
                modelInfo = result;

                if (!$.isEmptyObject(customizer.init)) {
                    if (customizer.init.hasOwnProperty("getParams")) {
                        params = customizer.init.getParams(result);
                        delete customizer.init.getParams;
                    }

                    if (customizer.init.hasOwnProperty("setUpInputs")) {
                        customizer.init.setUpInputs(result, source);
                        delete customizer.init.setUpInputs;
                        multiColSliders = $(".multi-col-slider").detach();
                    }
                }
                else {
                    if ($("#connectors-only-toggle")[0].checked) {
                        $(".current_price").text(result[params.price.connectors].data);
                    } else {
                        $(".current_price").text(result[params.price.total].data);
                    }

                    $("input[name=\"columns\"]").prop({
                        "min": Math.round(result[params.cols.min].data),
                        "max": Math.round(result[params.cols.max].data)
                    }).val(result[params.cols.value].data)
                      .trigger("input");
                    updateMultiColSliders(result);

                    $("input[name=\"rows\"]").prop({
                        "min": Math.round(result[params.rows.min].data),
                        "max": Math.round(result[params.rows.max].data)
                    }).val(result[params.rows.value].data)
                      .trigger("input");

                    $("input[name=\"width\"]").prev("output")
                        .text(Math.round(result[params.overallWidth].data));
                }
                break;
        }
    }
    else {
        // the result apparently might be undefined for the command setParameterValue in many cases
        console.warn("ERROR: Unrecognized message");
    }
}


// Fades out loading screen and removes it from the DOM
// Unblurs customizer and fixes its height
function removeLoadingScreen() {
    $(".customizer__loading-screen .spinner").removeClass("fade-down").addClass("fade-up");
    setTimeout(function() {
        $(".customizer__loading-screen").fadeOut(600, function() {
            $(this).remove();
        });
        $(".blur-me").removeClass("blur-me");
        let target_height = $(".product_section").outerHeight(true);
        $(".customizer").animate({height: target_height + "px"}, 2000, function() {
            $(this).css("height", "auto");
        });
    }, 250);
}


var multiColSliders = [];
var max_col_width;


function enableDimensionsToggle (param, paramData, source) {
    $("#dimensions-toggle").removeClass("hide-me");
    var $targetInput = $("#dimensions-toggle input");
    if (paramData.default == "0")
        $targetInput.prop("checked", true);
    $targetInput.prop("name", param);

    $targetInput.change(function() {
        var myValue = "";
        if (this.checked)
            myValue = "0";
        var payload = {
            command: "setParameterValue",
            arguments: [this.name, myValue]
        };
        console.log(payload);
        source.postMessage(payload, "https://www.shapediver.com");
    });
    //console.log(paramData);;
};


function updateMultiColSliders(result) {
    var numCol = result[params.cols.value].data;
    if (numCol-1 > multiColSliders.length) {
        $(".customizer__multicol-slider").addClass("blur-me");
    }
    else {
        $(".customizer__multicol-slider").removeClass("blur-me");
        if (numCol-1 !== $(".multi-col-slider").length) {
            if (numCol-1 > $(".multi-col-slider").length) {
                for (let i=$(".multi-col-slider").length; i<numCol-1; i++) {
                    $(".customizer__multicol-slider").append(multiColSliders[i]);
                }
            } else {
                let $mySliders = $(".multi-col-slider");
                for (let i = numCol-1; i<$mySliders.length; i++) {
                    $(multiColSliders[i]).children("input").value = $mySliders[i].value;
                    $mySliders[i].remove();
                }
            }
            var thumbWidth = 26;
            var containerWidth = $(".customizer__multicol-slider").width();
            var bufferWidth = 40;
            var halfSliderWidth = (containerWidth-(numCol*bufferWidth)+(thumbWidth/2))/numCol;
            max_col_width = halfSliderWidth*2;
            containerWidth -= (halfSliderWidth*2 + bufferWidth - (thumbWidth/4));

            $(".multi-col-slider").each(function(){
                $(this).css({
                    width: halfSliderWidth*2 + "px",
                    right: containerWidth + "px"
                });
                containerWidth -= (halfSliderWidth + bufferWidth);
            }).children("input").trigger("input");
        }
    }
}


function calculateWeight() {
    var unitWeights = {
        "m1": (3.6/16), //lbs per connector
        "m2": (3.6/16), //lbs per connector
        "m3": (4.6/16),  //lbs per connector
        "Hand-Oiled Maple": 2.6, //lbs per sq ft
        "Prefinished Walnut": 2.6, //lbs per sq ft
        "Amber Bamboo": 2.5623 //lbs per sq ft
    }

    var wood_type = $("#material").text();
    var total_weight =
        modelInfo[params.connectors.m1].data * unitWeights["m1"] +
        modelInfo[params.connectors.m2].data * unitWeights["m2"] +
        modelInfo[params.connectors.m3].data * unitWeights["m3"];

    if ($("#connectors-only-toggle")[0].checked)
        total_weight *= 1.1;
    else
        total_weight += modelInfo[params.area].data * unitWeights[wood_type];
    return total_weight;
}


var defaultColSliderVal = .5;
function getCustomizerInfo() {
    var info = "";
    $(".panel__section").children().each(function() {
        $cols = $(this).children();
        if ($(this).hasClass("panel__row--multicol-toggle")) {
            info += "<strong>Adjusted Columns:</strong> ";
            var col_info = "";

            $(".multi-col-input").each(function(index) {
                if (this.value != defaultColSliderVal) {
                    if (col_info.length != 0)
                        col_info += ", ";
                    col_info += (index+1) + " - " + this.value;
                }
            });

            if (col_info.length > 0)
                info += col_info;
            else
                info += "None";
        }
        else if ($cols.hasClass("slider-container")) {
            var $input = $cols.find("input");
            info += "<strong>" + $cols[0].innerText + ":</strong> " + $input[0].value;
            if ($input.prev().hasClass("in-slider") || $input.prev().hasClass("cm-slider"))
                info += "in";
        }
        else if ($cols.hasClass("option-cell")) {
            $text = $($cols[0]).find("span");
            if ($text[0].innerText === "Wood Finish" && $("#connectors-only-toggle")[0].checked === true)
                info += "<strong>Connectors only</strong>";
            else
                info += "<strong>" + $text[0].innerText + ":</strong> " + $text[1].innerText;
        }
        info += "<br>";
    });

    let boardArr = getBoardArr("hboards").concat(getBoardArr("vboards"));
    info += "<br>" + Handlebars.templates['boards-table']({"boardArr": boardArr});
    return info;
}


function getCustomizerHiddenInfo() {
    let paramsToAdd = {
        "Number of pads": params.connectors.pads,
        "Number of M1": params.connectors.m1,
        "Number of M2": params.connectors.m2,
        "Number of M3": params.connectors.m3,
        "Area (sq ft)": params.area
    };

    var hidden_info = "<style>.hide-me {display: none;}</style><div class=\"hide-me show-me\"><br><strong>Additional parameters:</strong><br>";
    for (var key in paramsToAdd) {
       hidden_info += key + ": " + modelInfo[paramsToAdd[key]].data + "<br>";
    }
    hidden_info += "</div>";
    return hidden_info;
}


function getBoardArr(type) {
    let boardArr = [];

    if (Array.isArray(modelInfo[params[type].num].data)) {
        for (let i = 0; i < modelInfo[params[type].num].data.length; i++) {
            boardArr.push({
                "name": type + (i+1),
                "length": modelInfo[params[type].length].data[i],
                "width": modelInfo[params[type].width].data[i],
                "num": modelInfo[params[type].num].data[i].trim().slice(1,-2)
            });
        }
    } else {
        boardArr.push({
            "name": type + "1",
            "length": modelInfo[params[type].length].data.trim(),
            "width": modelInfo[params[type].width].data.trim(),
            "num": modelInfo[params[type].num].data.trim().slice(1,-2)
        });
    }
    return boardArr;
}


function showSaveConfirmation(data) {
    $(".panel--save-confirmation").find(".project-name").text($("#project-title")[0].value);
    var product_url = $(".panel--save-confirmation a").prop("href");
    myIndex = product_url.lastIndexOf("/");
    product_url = product_url.slice(0,myIndex+1) + data.handle;
    $(".panel--save-confirmation a").prop("href", product_url);
    $(".panel--save-confirmation a").text(product_url);
    $(".panel--save-confirmation input[name=\"product_id\"]").val(data.id);

    $(".panel--save-confirmation").removeClass("panel--hidden");
    window.setTimeout(function() {
        resetPanelSpinner();
    }, 1000);
}


function resetPanelSpinner() {
    $(".panel--spinner").addClass("panel--hidden");
    $(".panel--spinner .spinner").removeClass("fade-down");
}
