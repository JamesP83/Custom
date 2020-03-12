customizer.init = {

createInputs: function(data, source) {
    for (var param in data) {
        if (!data[param].hidden) {
            let info = inputDefs.hasOwnProperty(data[param].visibleName) ? inputDefs[data[param].visibleName] : data[param];
            info.codeName = data[param].visibleName.trim().toLowerCase().replace(/ /g, "_");

            if (this.getRowInfo.hasOwnProperty(data[param].type)) {
                // Adds a new row to the form
                let rowInfo = this.getRowInfo[data[param].type](param, info);
                if (rowInfo != null) {
                    let $lastSection = $(".panel__section:last");
                    if ($lastSection.children().length >= 3 || !rowInfo.groupMe) {
                        $lastSection.after("<div class=\"panel__section\"></div>");
                    }
                    $(".panel__section:last").append(Handlebars.templates[rowInfo.templateName](rowInfo.data));
                }

                // Adds a new column slider thumb
                if (data[param].visibleName.toLowerCase().includes("column ")) {
                    let myData = {
                        "param": param,
                        "props": {"min": data[param].min, "max": data[param].max, "step": Math.pow(10, -(data[param].decimalPlaces)), "value": parseFloat(data[param].default)}
                    };
                    let myTemplate = Handlebars.templates['input-range-multicol'];
                    $(".customizer__multicol-slider").append(myTemplate(myData));
                }
            } else {
                console.log(data[param]);
            }
        }
    }
    delete this.getRowInfo;
},


getRowInfo: {
    imageUrls: {
        "Hand-Oiled Maple" : "{{ "swatch_maple.jpg" | asset_img_url: '100x' }}",
        "Prefinished Walnut" : "{{ "swatch_walnut.jpg" | asset_img_url: '100x' }}",
        "Amber Bamboo" : "{{ "swatch_bamboo.jpg" | asset_img_url: '100x' }}",
        "Aluminum" : "{{ "swatch_aluminum.jpg" | asset_img_url: '100x' }}",
        "Black" : "{{ "swatch_black.jpg" | asset_img_url: '100x' }}",
        "Gold" : "{{ "swatch_gold.jpg" | asset_img_url: '100x' }}"
    },

    Even: function(param, info) {
        let myData = {
            "templateName": "input-range",
            "groupMe": true,
            "data": {
                "output-class": "in-slider",
                "label": info.visibleName,
                "param": param,
                "description": "Overall " + info.visibleName.toLowerCase(),
                "props": {"name": info.codeName, "min": info.min, "max": info.max, "value": parseFloat(info.default), "step": "2"}
            }
        };
        if (info.visibleName === "Width")
            myData.data.label = "Width*";
        return myData;
    },

    Real: function(param, info) {
        if (info.visibleName.toLowerCase().includes("column ")) {
            if ($(".panel__row--multicol-toggle").length === 0) {
                return {
                    "templateName": "input-checkbox-multicol",
                    "groupMe": true,
                    "data": {"description": "Drag the arrows below the model to modify the width of each column. &#013;Tip: Make columns of a similar size the same size, giving you more options for reconfiguring your shelves."}
                };
            } else {
                return;
            }
        } else if (info.hidden && info.default >= 1) {
            return {
                "templateName": "input-hidden",
                "groupMe": true,
                "data": {
                    "param": param,
                    "props": {"name": info.codeName, "value": info.default}
                }
            };
        } else {
            let descMod = info.visibleName === "Columns" ? "Vertical" : "Horizontal";
            let myData = {
                "label": info.visibleName,
                "param": param,
                "description": descMod + " arrangement of shelves",
                "props": {"name": info.codeName, "value": info.default >= 1 ? info.default : 0, "step": "1"}
            }

            return {
                "templateName": "input-range",
                "groupMe": true,
                "data": myData
            };
        }
    },

    StringList: function(param, info) {
        let myDesc = info.visibleName === "Connector Color" ? "Color of anodized aluminum" :
            "3/4 inch, sustainably harvested plywood, formaldehyde-free soy based glue, hand finished with plant based oil";
        let myData = {
            "label": info.visibleName.trim(),
            "codeName": info.codeName,
            "param": param,
            "description": myDesc,
            "defaultChoice": info.choices[parseInt(info.default)],
            "pctWidth": 90/info.choices.length,
            "choices": []
        }

        for (let i=0; i<info.choices.length; i++) {
            myData.choices.push({
                "name": info.choices[i],
                "imgUrl": this.imageUrls[info.choices[i]],
                "isChecked": i === parseInt(info.default)
            });
        }

        return {
            "templateName": "input-radio",
            "groupMe": false,
            "data": myData
        };
    }
},


getParams: function(data) {
    let params = {
        "price": {},
        "cols": {},
        "rows": {},
        "connectors": {},
        "area": "",
        "hboards": {},
        "vboards": {},
        "overallWidth": ""
    };

    const paramMap = {
        "Output_price": ["price", "total"],
        "Output_price_ConnectorsOnly": ["price", "connectors"],
        "column_number": ["cols", "value"],
        "min_column_number": ["cols", "min"],
        "max_column_number": ["cols", "max"],
        "row_number": ["rows", "value"],
        "min_row_number": ["rows", "min"],
        "max_row_number": ["rows", "max"],
        "#_of_m1": ["connectors", "m1"],
        "#_of_m2": ["connectors", "m2"],
        "#_of_m3": ["connectors", "m3"],
        "#_of_pads": ["connectors", "pads"],
        "total_sqft": ["area"],
        "length_horizontal_boards": ["hboards", "length"],
        "depth_horizontal_boards": ["hboards", "width"],
        "quantity_horizontal_boards": ["hboards", "num"],
        "length_vertical_boards": ["vboards", "length"],
        "depth_vertical_boards": ["vboards", "width"],
        "quantity_vertical_boards": ["vboards", "num"],
        "OverallHorizontalDim": ["overallWidth"]
    };

    for (var param in data) {
        let paramName = data[param].name;
        if (paramMap.hasOwnProperty(data[param].name)) {
            if (paramMap[paramName].length > 1)
                params[paramMap[paramName][0]][paramMap[paramName][1]] = param;
            else
                params[paramMap[paramName][0]] = param;
        }
    }
    return params;
},


setUpInputs: function(data, source) {
    $(".customizer__form").removeClass("product_form");
    this.setRowColValues(data);
    delete this.setRowColValues;

    this.addEventListeners.mainPanel(source);
    this.addEventListeners.sidePanel(source);
    this.addEventListeners.iframeOverlay(source);
    delete this.addEventListeners;

    let linkedInputs = {
        "width": {
            "name": "columns",
            "value": data[params.cols.value].data,
            "info": {"minMod": 36, "minOffset": 20, "maxMod": 9.6}
        },
        "height": {
            "name": "rows",
            "value": data[params.rows.value].data,
            "info": {"minMod": 17, "minOffset": 0, "maxMod": 6}
        }
    };
    let args = [[],[]];
    //convert to func and make more robust
    for (var input1 in linkedInputs) {
        let $input1 = $("input[name=" + input1 + "]");
        let $input2 = $("input[name=" + linkedInputs[input1].name + "]");

        let input2Min = Math.round($input1.val()/linkedInputs[input1].info.minMod);
        let input2Max = Math.round($input1.val()/linkedInputs[input1].info.maxMod);
        let input2Val = $input2.val();

        if (input2Val < input2Min)
            input2Val = input2Min;
        else if (input2Val > input2Max)
            input2Val = input2Max;

        args[0].push($input1.data("param"), $input2.data("param"));
        args[1].push($input1.val(), ((input2Val-input2Min)/(input2Max-input2Min)).toFixed(2));
    }

    if (args[0].length > 0 && args[1].length > 0)
        source.postMessage({command: "setParameterValues", arguments: args}, "https://www.shapediver.com");

    $(".slider-container input").trigger("input");
},


setRowColValues: function(data) {
    let $colInput = $("input[name=\"columns\"]");
    if ($colInput.prop("type") === "range" && $colInput.prop("value") === "0") {
        $colInput[0].value = data[params.cols.value].data;
        $colInput.prop({
            "min": data[params.cols.min].data,
            "max": data[params.cols.max].data
        });
    }

    let $rowInput = $("input[name=\"rows\"]");
    if ($rowInput.prop("type") === "range" && $rowInput.prop("value") === "0") {
        $rowInput[0].value = data[params.rows.value].data;

        $rowInput.prop({
            "min": Math.floor(data[params.rows.min].data),
            "max": Math.round(data[params.rows.max].data)
        });
    }
},

//might need work; convert class/id names to BEM
addEventListeners: {
    mainPanel: function(source) {
        let that = this;
        $(".panel__section .panel__row").each(function() {
            let $input = $(this).find("input");
            let inputName = $input.prop("name");
            switch (inputName) {
                case "width":
                    that.linkedInput(inputName, "columns", {"minMod": 36, "maxMod": 9.6}, source);
                    break;
                case "height":
                    that.linkedInput(inputName, "rows", {"minMod": 17, "maxMod": 6}, source);
                    break;
                case "depth":
                    that.simpleIntSlider(inputName, source); break;
                case "columns":
                case "rows":
                    if ($input.prop("type") === "range")
                        that.rowColSlider(inputName, source);
                    break;
                case "multicol-toggle":
                    that.multicolToggle(); break;
                case "connector_color":
                case "material":
                    that.swatchSelector(inputName, source); break;
                default: console.warn("Non-functional input: ", inputName);
            }
        });

        $("#in-cm-toggle input").change(function() {
            $(this).siblings().toggleClass("active");
            if (this.checked) {
                $(".in-slider").removeClass("in-slider").addClass("cm-slider").next("input").trigger("input");
            } else {
                $(".cm-slider").removeClass("cm-slider").addClass("in-slider").next("input").trigger("input");
            }
        });

        $("input[type=\"range\"]").on("input", function() {
            var $elem = $(this);
            var $myOutput = $elem.prev("output");
            var $myFiller = $myOutput.prev("div").children("div");
            var myPct = ($elem[0].value-$elem[0].min)/($elem[0].max-$elem[0].min);
            var myLoc = (($elem.width()-$myOutput.width()) * myPct) + ($myOutput.width()/2);
            $myOutput.css("left", myLoc + "px");
            $myFiller.css("width", myPct*100 + "%");

            if ($myOutput.hasClass("cm-slider"))
                $myOutput.text(Math.round($elem[0].value*2.54));
            else
                $myOutput.text($elem[0].value);
        });

        this.mainPanelFooter();
    },

    simpleIntSlider: function(inputName, source) {
        $("input[name=" + inputName + "]").change(function() {
            $(".current_price").text("$---.--");
            var payload = {
                command: "setParameterValue",
                arguments: [this.dataset.param, this.value]
            };
            source.postMessage(payload, "https://www.shapediver.com");
        });
    },

    rowColSlider: function(inputName, source) {
        $("input[name=" + inputName + "]").change(function() {
            $(".current_price").text("$---.--");
            var payloadValue = ((this.value-this.min)/(this.max-this.min)).toFixed(2);
            var payload = {
                command: "setParameterValue",
                arguments: [this.dataset.param, payloadValue]
            };
            source.postMessage(payload, "https://www.shapediver.com");
        });
    },

    swatchSelector: function(inputName, source) {
        $("input[name=" + inputName + "]").change(function() {
            $(".current_price").text("$---.--");
            $("#" + this.name).text(this.value);
            var payload = {
                command: "setParameterValue",
                arguments: [this.dataset.param, this.dataset.indexNumber]
            };
            source.postMessage(payload, "https://www.shapediver.com");
        });
    },

    linkedInput: function(inputName1, inputName2, inputInfo, source) {
        $("input[name=" + inputName1 + "]").change(function() {
            $(".current_price").text("$---.--");

            let $input2 = $("input[name=" + inputName2 + "]");
            let input2Min = Math.round(this.value/inputInfo.minMod);
            let input2Max = Math.round(this.value/inputInfo.maxMod);
            let input2Val = $input2.val();

            if (input2Val < input2Min)
                input2Val = input2Min;
            else if (input2Val > input2Max)
                input2Val = input2Max;

            var payload = {
                command: "setParameterValues",
                arguments: [[this.dataset.param, $input2.data("param")],
                    [this.value, ((input2Val-input2Min)/(input2Max-input2Min)).toFixed(2)]]
            };
            source.postMessage(payload, "https://www.shapediver.com");
        });
    },

    multicolToggle: function() {
        $(".panel__row--multicol-toggle").hover(function() {
            $(".multi-col-thumb").toggleClass("multi-col-highlight");
        });

        $(".panel__row--multicol-toggle input").change(function() {
            $(".customizer__multicol-slider").toggleClass("no-height").prev().toggleClass("add-multi-col-spacing");
        });
    },

    mainPanelFooter: function() {
        $("#connectors-only-toggle").change(function() {
            if (this.checked) {
                $(".current_price").text(modelInfo[params.price.connectors].data);
            } else {
                $(".current_price").text(modelInfo[params.price.total].data);
            }
            $("#custom-controls .panel__row:last-child > *").toggleClass("blur-me");
        });

        $("#customizer-buy").click(function() {
            $("#main-panel").addClass("panel--dark");
            $myPanel = $(".panel--create");
            $myPanel.find("h1").text("Purchase");
            $myPanel.find("h2").text("Save a final version of your product before checkout.");
            $myPanel.find(".panel__action span").text($(".panel__action button").data("label"));
            $myPanel.removeClass("panel--hidden");
        });

        $("#customizer-save").click(function() {
            $("#main-panel").addClass("panel--dark");
            $myPanel = $(".panel--create");
            $myPanel.find("h1").text("Save/Share");
            $myPanel.find("h2").text("View your product anywhere, and share it with others");
            $myPanel.find(".panel__action span").text("Save");
            $myPanel.removeClass("panel--hidden");
        });
    },


    sidePanel: function(source) {
        $(".panel__back").click(function() {
            $("#main-panel").removeClass("panel--dark");
            $(".panel:not(.panel--controls)").addClass("panel--hidden");
        });

        $(".customizer__form ~ p a").click(function() {
            $(".panel--controls").addClass("panel--dark");
            $(".panel--contact").removeClass("panel--hidden");
        });

        $(".panel--contact input, .panel--contact textarea").on("input", function() {
            $(this).removeClass("panel__input--invalid");
        });

        $(".panel--save-confirmation .add_to_cart").click(function() {
            $(".customizer__form").addClass("customizer__form--add-to-cart")
                .trigger("submit").removeClass("customizer__form--add-to-cart");
        });

        this.createProduct();
        this.sendMessage();
    },

    createProduct: function() {
        $(".customizer__form").submit(function(e) {
            if (!$(this).hasClass("customizer__form--add-to-cart")) {
                e.preventDefault();
                $(".panel--spinner .spinner").addClass("fade-down");
                $(".panel--spinner").removeClass("panel--hidden");

                let source = $("#sd-iframe")[0];
                source.contentWindow.postMessage({command: "getScreenshot"}, "https://www.shapediver.com");
                let payload = {
                    command: "requestExport",
                    arguments: [exportId, true]
                }
                source.contentWindow.postMessage(payload, "https://www.shapediver.com");

                customizer.getInfo();
            }
        });
    },

    sendMessage: function() {
        $(".panel--contact button").click(function() {
            var $contactPanel = $(".panel--contact");
            var invalidInput = false;
            var myMessage = {};

            $contactPanel.find("input, textarea").each(function() {
                if (this.value.trim() === "" || !this.validity.valid) {
                    $(this).addClass("panel__input--invalid");
                    invalidInput = true;
                }
                else {
                    $(this).removeClass("panel__input--invalid");
                    if (this.type === "checkbox") {
                        myMessage[this.name] = this.checked;
                    } else if (this.name === "customer_name") {
                        let space_index = this.value.lastIndexOf(" ");
                        if (space_index !== -1) {
                            myMessage.first_name = this.value.slice(0, space_index);
                            myMessage.last_name = this.value.slice(space_index+1);
                        }
                        else {
                            myMessage.first_name = this.value;
                            myMessage.last_name = "";
                        }
                    } else {
                        myMessage[this.name] = this.value;
                    }
                }
            });

            if (!invalidInput) {
                $.ajax({
                    type: "post",
                    dataType: "json",
                    url: "https://modos.herokuapp.com/contact",
                    data: myMessage,
                    success: function() {
                        $(".panel--contact-confirmation").removeClass("panel--hidden");
                    }
                });
            }
        });
    },


    iframeOverlay: function(source) {
        $(".multi-col-input").on("input", function() {
            var pctPos = 100 * this.value/.99;
            $(this).prev().css("left", "calc(" + pctPos + "% - 13px)");

            if (this.value >= .5) {
                let nextColMin = this.value % .5;
                let pctOfMax = 100*(.99-nextColMin)/.99;
                $(this).parent().next().children("input")
                    .prop("min", nextColMin)
                    .css("width", "calc(" + pctOfMax + "% + 26px)")
                    .trigger("input");
            }
        }).change(function() {
            $(".current_price").text("$---.--");
            var payload = {
                command: "setParameterValue",
                arguments: [this.dataset.param, this.value]
            };
            source.postMessage(payload, "https://www.shapediver.com");
        });

        $(".multicol__reset").click(function() {
            multiColSliders.each(function() {
                $(this).find("input").val(.5);
            });
            $(".multi-col-input").val(.5).trigger("change").trigger("input");
        });
    }
}
};
