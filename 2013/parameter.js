var has_loaded = false; // tells the request handler if this page has already been loaded
	require(['dojo/_base/lang',
        'dojo/dom',
        'dijit/registry',
        'dojo/parser',
        'dijit/form/Button',
        'dojo/_base/array',
        'dojo/_base/xhr', 
        'dijit/form/TextBox',
        'dijit/form/Textarea',
        'dojox/form/RangeSlider',
        'dijit/form/HorizontalRule',
        'dijit/form/HorizontalRuleLabels',
        'dijit/InlineEditBox',
        'dojo/data/ItemFileWriteStore',
        'dojo/store/Observable',
        'dojox/grid/DataGrid',
        'dojo/store/Memory',
        'dojo/data/ObjectStore',
        'dojox/grid/_CheckBoxSelector',
        'dijit/form/CheckBox',
        'dijit/form/RadioButton',
        'dojox/grid/cells/dijit',
        'dijit/layout/ContentPane',
        'dojo/domReady!'], 
        function(lang, dom, registry, parser, Button, baseArray, xhr, TextBox, Textarea, RangeSlider, HorizontalRule, HorizontalRuleLabels, InlineEditBox, ItemFileWriteStore, Observable, DataGrid, Memory, ObjectStore, _CheckBoxSelector, CheckBox, RadioButton, cells, CP)
        {
            /*  CREATE A DATA STORE TO CONTAIN ALL THE CONTENT OF THE SERVER  */
            var fullDbMemStore = new Memory({data: new Array()});
                fullDbMemStore = Observable(fullDbMemStore);
                var fullDataStore = new ObjectStore({
                    objectStore: fullDbMemStore
                });
            window.fullDbMemStore = fullDbMemStore; //MAKE IT GLOBAL

            var paramStore = new Memory({data: new Array()});
                paramStore = Observable(paramStore);
                var paramDataStore = new ObjectStore({
                    objectStore: paramStore
                });

            window.paramStore = paramStore;
            window.paramDataStore = paramDataStore;
            

            /*  FUNCTION TO GET ALL THE DB DATA AND FILL THE DATA STORE  */
            GetFullDbStore = function()
            {
                xhr.get(
                {
                    url:'/global',
                    handleAs: 'json',
                    content:
                    {
                        action: 'getAll',
                        loaded: has_loaded = true,
                    },
                    load: function(response)
                    {
                        fullDbMemStore.data = response;
                        ParamGrid.buildGrid();
                    },
                    error: function(error)
                    {
                        var msg = 'There was an error getting the db. Error: ' + error;
                        dom.byId("serverResponse").innerHTML = 'Response: ' + msg;
                        console.log(msg);
                    }
                });
            }

            function addToParamStore(object)
            {
                var o = new Object(object);
                paramStore.put(lang.mixin(
                    {id: paramStore.data.length},
                    o,
                    {formula: object.members.formula},
                    {reportRange: object.members.report_range.x + "-" + object.members.report_range.y}));
            }


            /********************************     Parameter Grid      *********************************/

            //OBJECT TO ASSOCIATE ALL FUNCTIONS AND PROPERTIES FOR THE FIXED PI GRID
            var ParamGrid = new Object();

            //BUILD THE GRID WITH THE GIVEN PARAMETERS
            ParamGrid.buildGrid = function()
            {
                //DEFINE THE LAYOUT
                var layout = [[
                  {'name': 'Parameter', 'field': 'name', 'width': '25%', editable: true},
                  {'name': 'Formula', 'field': 'formula', 'width': '65%', editable: true},
                  {'name': 'Report Range', 'field': 'reportRange', 'width': '10%', editable: true},
                ]];

                var parameters = fullDbMemStore.query({type: 'p'});
                for(var i = 0; i < parameters.length; i++)
                {
                    paramStore.put(lang.mixin(
                        { id: i},
                        parameters[i],
                        {formula: parameters[i].members.formula},
                        {reportRange: parameters[i].members.report_range.x + "-" + parameters[i].members.report_range.y}
                        ));
                }

                registry.remove('ParamGrid');

                //CREATE THE DOJO GRID AND RENDER IT
                var grid = new DataGrid({
                    store: paramDataStore,
                    structure: layout,
                    selectionMode: 'single'
                    }, 'ParamGrid');
                grid.startup(); //RENDER

                //REGISTER NOTIFY EVENT TO REFRESH THE GRID
                dojo.connect(paramStore, 'notify', function(){grid._refresh()});

                //UPDATE THE DIV AND THE SELECTION PROPERTY
                function reportSelection(node)
                {
                    ParamGrid.selected_fields = this.selection.getSelected();
                    if(ParamGrid.selected_fields.length > 0)
                    {
                        var msg = "You have selected " + ((ParamGrid.selected_fields.length > 1) ? " ": " ");
                    }
                    else
                        return;
                    var names = baseArray.map(ParamGrid.selected_fields, function(item)
                    {
                        return item.name;
                    }, this);
                    node.innerHTML = msg + names.join(", ");
                }

                //REGISTER SELECTION_CHANGE WITH REPORTSELECTION METHOD                
                grid.on("SelectionChanged", 
                    lang.hitch(grid, reportSelection, dom.byId("serverResponse")), true);

                //REGISTER THE DELETE AND BACKSPACE KEYS TO DELETE BUTTON
                dojo.connect(grid,"onKeyUp", function(e)
                {
                    if(e.keyCode == 46)
                    {
                        button_delete_param_class.onClick();
                    }
                });

                //REGISTER DOUBLE CLICK EVENT WITH THE DEFINED FUNCTION
                //THE FUNCTION GETS PI NAME OF THE DOUBLE CLICKED ROW AND PASSES
                //IT TO A FUNCTION TO ADD ADD A PROPERTY TO THE DEFINITION
                dojo.connect(grid,"onCellDblClick", function(e)
                    {
                        button_add_param_to_formula.onClick();
                    });

                //GLOBALIZE STORE DATA AND THE GRID
                window.paramGrid = grid;
            }

            /*  BUILD PGF OBJECT TO CHANGE BY ANALYZING THE CHANGES  */
            ParamGrid.analyzeChanges = function()
            {
                var parameters = [];
                var store = paramStore.data;

                for(var i = 0; i < store.length; i++)
                {
                    var p = store[i];
                    var report_elements = p.reportRange.split("-");
                    console.log(report_elements);
                    var temp = {};
                    temp.members = p.members;
                    temp.members.formula = p.formula;
                    temp.members.dependencies = getDependencies(p.formula);
                    temp.members.report_range.x = report_elements[0];
                    temp.members.report_range.y = report_elements[1];
                    temp._id = p._id;
                    temp.name = p.name;
                    temp.type = p.type;
                    parameters.push(temp);
                }
                console.log(parameters);
                ParamGrid.commitChanges(parameters);
            }

            ParamGrid.commitChanges = function(parameters)
            {
                //TELL THE SERVER TO ADD NEW PF AND SEND THE NEW PF OBJECT                
                xhr.get(
                {
                    url:"/individual", 
                    content: 
                    {
                        action: 'change_parameters',
                        parameters: JSON.stringify(parameters),
                        loaded: has_loaded=true,
                    },
                    load:function(response)
                    {
                        //UPDATE THE SERVER RESPONSE
                        dom.byId("serverResponse").innerHTML = "Response from server: All Changes succesful";
                        alert("Changes were successful");
                        dom.byId("txtBox_paramName").value = '';
                        dom.byId("txtBox_paramFormula").value = '';

                        //THE SERVER WILL SEND BACK THE OBJECT IF THE ADD WAS SUCCESSFUL
                        //ADD THE OBJECT TO THE STORE
                        GetFullDbStore();
                    },
                    error:function(error)
                    {
                        //IF THERE WAS AN ERROR, REPORT IT IN THE CONSOLE AND TO THE USER
                        alert("Failure: Changes were unsuccesful");
                        console.log("There was an error: \n"+error);
                        dom.byId("serverResponse").innerHTML = "Response from server: " + error;
                    }
                });
            }

            /********************************     END PARAMETER GRID      *********************************/


            /********************************     Text Boxes, Buttons, etc      *********************************/

            /*  TEXT BOXES  */
            var txtBox_paramName = new TextBox({},"txtBox_paramName");
            var txtBox_paramFormula = new Textarea({},"txtBox_paramFormula");

            //REGISTER THE RETURN KEY TO THE COMMIT BUTTON FOR THE NAME TEXTBOX
            dojo.connect(txtBox_paramName, "onKeyUp", function(e)
            {
                if(e.keyCode == 13)
                    button_commit_new.onClick();
            });

            //REGISTER THE RETURN KEY TO THE COMMIT BUTTON FOR THE VALUE TEXTBOX
            dojo.connect(txtBox_paramFormula, "onKeyUp", function(e)
            {
                if(e.keyCode == 13)
                    button_commit_new.onClick();
            });

            //BUTTON TO REMOVE A FIXED PI
            var button_add_param_to_formula = new Button(
            {
                label: 'Add To Formula', 
                onClick: function()
                {
                    var selected = ParamGrid.selected_fields[0];
                    if(!selected)
                    {
                        return alert('Select a Parameter to Copy.');
                    }
                    console.log(selected);
                    add_param_to_formula(selected);
                },
            }, 'button_add_param_to_formula');

            var add_param_to_formula = function(selected) 
            {
                var name = selected.name;
                if(dom.byId("txtBox_paramFormula").value == "")
                    dom.byId("txtBox_paramFormula").value = name; 
                else if(dom.byId("txtBox_paramFormula").value[dom.byId("txtBox_paramFormula").value.length-1] == ';')
                    dom.byId("txtBox_paramFormula").value += name;
                else
                    dom.byId("txtBox_paramFormula").value += ';' + name;   
            }

            //BUTTON TO REMOVE A FIXED PI
            var button_multiplication = new Button(
            {
                label: '*', 
                onClick: function()
                {
                    if(dom.byId("txtBox_paramFormula").value == "")
                        dom.byId("txtBox_paramFormula").value = '*'; 
                    else if(dom.byId("txtBox_paramFormula").value[dom.byId("txtBox_paramFormula").value.length-1] == ';')
                        dom.byId("txtBox_paramFormula").value += '*';
                    else
                        dom.byId("txtBox_paramFormula").value += ';' + '*';   
                },
            }, 'button_multiplication');

            //BUTTON TO REMOVE A FIXED PI
            var button_division = new Button(
            {
                label: '/', 
                onClick: function()
                {
                    if(dom.byId("txtBox_paramFormula").value == "")
                        dom.byId("txtBox_paramFormula").value = '/'; 
                    else if(dom.byId("txtBox_paramFormula").value[dom.byId("txtBox_paramFormula").value.length-1] == ';')
                        dom.byId("txtBox_paramFormula").value += '/';
                    else
                        dom.byId("txtBox_paramFormula").value += ';' + '/';   
                },
            }, 'button_division');

            //BUTTON TO REMOVE A FIXED PI
            var button_addition = new Button(
            {
                label: '+', 
                onClick: function()
                {
                    if(dom.byId("txtBox_paramFormula").value == "")
                        dom.byId("txtBox_paramFormula").value = '+'; 
                    else if(dom.byId("txtBox_paramFormula").value[dom.byId("txtBox_paramFormula").value.length-1] == ';')
                        dom.byId("txtBox_paramFormula").value += '+';
                    else
                        dom.byId("txtBox_paramFormula").value += ';' + '+';   
                },
            }, 'button_addition');

            //BUTTON TO REMOVE A FIXED PI
            var button_subtraction = new Button(
            {
                label: '-', 
                onClick: function()
                {
                    if(dom.byId("txtBox_paramFormula").value == "")
                        dom.byId("txtBox_paramFormula").value = '-'; 
                    else if(dom.byId("txtBox_paramFormula").value[dom.byId("txtBox_paramFormula").value.length-1] == ';')
                        dom.byId("txtBox_paramFormula").value += '-';
                    else
                        dom.byId("txtBox_paramFormula").value += ';' + '-';   
                },
            }, 'button_subtraction');

            //BUTTON TO REMOVE A FIXED PI
            var button_delete_param_class = new Button(
            {
                label: 'Delete', 
                onClick: function()
                {
                    console.log(ParamGrid.selected_fields);
                    remove_param_class(ParamGrid.selected_fields)
                },
            }, 'button_delete_param_class');


            //COMMIT CHANGES BUTTON
            var button_commitChanges = new Button(
                {
                    label: 'Commit Changes', 
                    onClick: function()
                    {
                        ParamGrid.analyzeChanges();
                    }
                }, "button_commitChanges");


            //RULES DIV FOR THE SLIDER
            var rulesNode = dojo.create("div", {}, dojo.byId("reportRangeSlider"), "first");

            //RULES DECLARATION. THESE ARE THE HASHES ONTOP OF THE SLIDER
            var sliderRules = new dijit.form.HorizontalRule(
            {
                container: "topDecoration",
                count: 4,
                style: "height: 8px",
            }, rulesNode);

            //LABELS DIV FOR THE SLIDER
            var labelsNode = dojo.create("div", {}, dojo.byId("reportRangeSlider"), "first");

            //BOTTOM NUMBERS FOR THE SLIDER.
            var sliderLabels = new dijit.form.HorizontalRuleLabels(
            {
                container: "bottomDecoration",
                count: 4,
                labels: [1,2,3,4],
                labelStyle: "font-style: italic; font-size: 1.0em",
            }, labelsNode);

            //THE SLIDER
            var reportRangeSlider = new dojox.form.HorizontalRangeSlider(
            {
                value: [1,4],
                minimum: 1,
                maximum: 4,
                discreteValues: 4,
                showButtons: false,
                onChange: function(value)
                {
                    dom.byId("reportRange").innerHTML = "Report Range: " + value;
                }
            },"reportRangeSlider");

            //RENDER THE SLIDER AND ITS RULERS
            reportRangeSlider.startup();
            sliderRules.startup();
            sliderLabels.startup();

            //DISPLAY THE VALUE OF THE SLIDER
            dom.byId("reportRange").innerHTML = "Report Range: " + reportRangeSlider.value;
            console.log(reportRangeSlider.value);


            //BUTTON TO SUBMIT A NEW PI            
            var button_commit_new = new Button(
            {
                label: 'Commit',
                onClick: function()
                {
                    //REQUIREMENTS FOR A VALID NEW PI
                    if(dom.byId("txtBox_paramName").value=="")
                    {
                         alert("Enter a name into the name field");
                         return;
                    }

                    /*  GET THE RANGE FROM THE SLIDER  */
                    var range_x = reportRangeSlider.value[0]; 
                    var range_y = reportRangeSlider.value[1];

                    var dependencies = getDependencies(dom.byId("txtBox_paramFormula").value);
                    var param_class = {};
                    param_class.type = 'p';
                    param_class.name = dom.byId("txtBox_paramName").value;
                    param_class.members = {};
                    param_class.members.formula = dom.byId("txtBox_paramFormula").value;
                    param_class.members.dependencies = dependencies;
                    param_class.members.report_range = {};
                    param_class.members.report_range.x = range_x;
                    param_class.members.report_range.y = range_y;
                    new_param_class(param_class);
                }
            }, 'button_commit_new');

            //FUNCTION SUBMITS THE NEW PI TO THE SERVER
            //IF THE SERVER SUCCEEDS, THE SERVER RETURNS THE OBJECT
            //AND THE OBJECT IS ADDED TO THE APPROPRIATE STORE
            new_param_class = function(param_class)
            {
                if(!param_class) //IF THE PI IS NULL, SOMETHING IS WRONG.
                {
                    alert('There was an error adding the new parameter class.');
                    return;
                }

                paramDataStore.save();

                //SEND THE NEW PI TO THE SERVER
                xhr.get(
                {
                    url:"/individual", 
                    handleAs: 'json',
                    content: 
                    {
                        action: 'new_param_class',
                        param_class: JSON.stringify(param_class),
                        loaded: has_loaded=true,
                    },
                    load:function(response)
                    {
                        //THE SERVER RETURNS AN EMPTY OBJECT IF THE DB ALREADY CONTAINS THE ITEM
                        //IF WE RECEIVE AN EMPTY OBJECT, TELL THE USER IT ALREADY EXISTS AND BAIL.
                        if(objectIsEmpty(response))
                        {
                            paramGrid._refresh();
                            return alert('The Parameter Class \'' + param_class.name + '\' already exists.');
                        }
                        //UPDATE THE SERVER RESPONSE DIV, CLEAR FIELDS, AND ADD THE OBJECT TO THE STORE
                        dom.byId("serverResponse").innerHTML = "Response from server: \'" + param_class.name + "\' successfully added.";
                        ClearTextFields();
                        addToParamStore(response);
                    },
                    error:function(error)
                    {
                        console.log("There was an error: \n"+error);
                        alert('There was an error adding the new parameter class: ' + error);
                        dom.byId("serverResponse").innerHTML = "Response from server: " + error;
                    }
                });

            }

            //SEND REQUEST TO SERVER TO REMOVE THE GIVEN PI
            remove_param_class = function(selected)
            {
                if(!selected || selected.length < 1)
                {
                    alert("Select something to delete");
                    return;
                }
                var param_class = selected[0];

                if(!param_class){ return alert('error deleting \''+param_class.name+'\''); }
                if(!confirm("Are you sure you want to delete \'" + param_class.name +"\'?"))
                    return;
                //REQUEST SERVER TO REMOVE
                xhr.get(
                {
                    url:"/individual",
                    content: 
                    {
                        action: 'remove_param_class',
                        param_class: JSON.stringify(param_class),
                        loaded: has_loaded=true,
                    },
                    load:function(response)
                    {
                        //UPDATE SERVER RESPONSE DIV AND REMOVE THE PI FROM THE STORE
                        dom.byId("serverResponse").innerHTML = "Response from server: " + response;
                        remove_from_db_store(param_class);
                    },
                    error:function(error)
                    {
                        //REPORT THE ERROR
                        console.log("There was an error: \n"+error);
                        dom.byId("serverResponse").innerHTML = "Response from server: " + error;
                    }
                });

                //REMOVE THE PI FROM THE FIXED STORE
                remove_from_db_store = function(param_class)
                {
                    var id = param_class.id;
                    paramStore.remove(id);
                }
            }

            //HELPER FUNCTION TO CHECK IF AN OBJECT POSSESSES ANY PROPERTIES
            function objectIsEmpty(map) 
            {
               for(var key in map) 
               {
                  if (map.hasOwnProperty(key)) 
                  {
                     return false;
                  }
               }
               return true;
            }

            //PARSE THE GIVEN DEFINITION STRING
            function getDependencies(formula)
            {
                //SPLIT THE STRING BY ';' AND STORE THE ELEMENTS IN AN ARRAY
                var val_elements = formula.split(";");

                //AN ARRAY TO MAKE UP THE PARSED ELEMENTS OF THE OUTPUT STRING
                var dependencies = [];

                //QUERY THE STORE FOR ALL PIs
                var pis = paramStore.data;

                //IF THERE ARE NO PIs OR THE ARRAY IS NULL,
                //REPORT AN ERROR and return an empty array
                if(pis.length < 1 || pis == null)
                {
                    var msg = 'There was a problem acquiring the parameters';
                    console.log('Parse Error: ' + msg);
                    return [];
                } 
                //WHILE ELEMENTS REMAIN
                while(val_elements.length > 0)
                {
                    //FLAG FOR WHEN AN ELEMENT IS MATCHED
                    var not_found = true;
                    //TEMP VARIABLE TO STORE A GRABBED PROPERTY
                    var temp_property;

                    //GET THE NEXT ELEMENT FROM THE ARRAY
                    var element = val_elements.shift();

                    //FIND THE ELEMENTS FROM THE GROUP AND MATCH THEM TO THE ELEMENTS
                    for(var i = 0; i < pis.length; i++)
                    {
                        if(!not_found) //IF ELEMENT HAS BEEN MATCHED, BREAK 
                            break;

                        //STORE CURRENT PARAMETER
                        var pi = pis[i];

                        //IF THE ELEMENT AND THE PARAMETER NAME MATCH, GET THE PARAMETERS VALUE
                        if(element == pi.name)
                        {
                            dependencies.push(pi._id);
                            not_found = false;
                        }
                    }

                }
                //IF THERE ARE NO MORE ELEMENTS BUILD THE STRING AND RETURN IT
                if(val_elements.length < 1)
                {
                    console.log(dependencies);
                    return dependencies;
                }
                else //IF WE GET HERE AND HAVEN'T REPORTED THE STRING AND WE STILL HAVE ELEMENTS, THERE'S AN ERROR
                {
                    alert('An unknown error occurred parsing the definition.');
                    return dependencies;
                }
            }


            //CLEAR ALL TEXT FIELDS
            function ClearTextFields()
            {
                dom.byId("txtBox_paramName").value = "";
                dom.byId("txtBox_paramFormula").value = "";
            }

            //ON LOAD, CLEAR TEXT FIELDS AND GET ALL THE DATA
            ClearTextFields();
            GetFullDbStore();
        });
