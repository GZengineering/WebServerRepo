var has_loaded = false; // tells the request handler if this page has already been loaded

	require(['dojo/_base/lang',
        'dojo/dom',
        'dijit/registry',
        'dijit/form/Button',
        'dojo/_base/array',
        'dojo/_base/xhr', 
        'dijit/form/TextBox',
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
        function(lang, dom, registry, Button, baseArray, xhr, TextBox, InlineEditBox, ItemFileWriteStore, Observable, DataGrid, Memory, ObjectStore, _CheckBoxSelector, CheckBox, RadioButton, cells, CP)
        {
            /*  CREATE A DATA STORE TO CONTAIN ALL THE CONTENT OF THE SERVER  */
            var fullDbMemStore = new Memory({data: new Array()});
                fullDbMemStore = Observable(fullDbMemStore);
                var fullDataStore = new ObjectStore({
                    objectStore: fullDbMemStore
                });
            window.fullDbMemStore = fullDbMemStore; //MAKE IT GLOBAL
            

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
                        allocateStores();
                    },
                    error: function(error)
                    {
                        var msg = 'There was an error getting the db. Error: ' + error;
                        dom.byId("serverResponse").innerHTML = 'Response: ' + msg;
                        console.log(msg);
                    }
                });
            }

            /*  FILL THE SUBSTORES FOR THE PIS AND BUILD THE GRIDS  */
            function allocateStores()
            {
                /**  ALLOCATE GLOBAL FIXED PI MEMORY STORE  **/

                var fixedMemStore = new Memory({data: new Array()});
                fixedMemStore = Observable(fixedMemStore);
                var fixedDataStore = new ObjectStore({
                    objectStore: fixedMemStore
                });

                //QUERY THE GLOBAL STORE OF THE DB FOR FIXED PIS
                var fixed_PIs = fullDbMemStore.query({pi_type: 'fixed'}); 


                /**  ALLOCATE GLOBAL COMPUTED PI MEMORY STORE  **/

                var compMemStore = new Memory({data: new Array()});
                compMemStore = Observable(compMemStore);
                var compDataStore = new ObjectStore({
                    objectStore: compMemStore
                });

                //QUERY THE GLOBAL DB STORE FOR COMPUTED PIS
                var comp_PIs = fullDbMemStore.query({pi_type: 'computed'});


                /*  GLOBALIZE THE SUB-STORES  */
                window.fixedMemStore = fixedMemStore;
                window.fixedDataStore = fixedDataStore;
                window.compMemStore = compMemStore;
                window.compDataStore = compDataStore;


                /*  BUILD ALL THE GRIDS  */
                FixedGrid.buildGrid(fixed_PIs);
                CompGrid.buildGrid(comp_PIs);
            }

            /********************************     Fixed PI Grid      *********************************/

            //OBJECT TO ASSOCIATE ALL FUNCTIONS AND PROPERTIES FOR THE FIXED PI GRID
            var FixedGrid = new Object();

            //ADD THE VALUE OF THE GIVEN PI TO THE DEFINITION TEXT BOX
            FixedGrid.addValueToDefinition = function(pi_name)
            {
                var pair = new Object();
                pair.f = pi_name;
                pair.p = 'value';
                if(dom.byId('txtBox_paramDef').value == '')
                    var pairString = JSON.stringify(pair);
                else if (dom.byId('txtBox_paramDef').value[dom.byId('txtBox_paramDef').value.length-1] == ';')
                    var pairString = JSON.stringify(pair);
                else    
                    var pairString = ';' + JSON.stringify(pair);

                var addThis = pairString; // This is the text string to add to the textbox
                dom.byId('txtBox_paramDef').value += addThis; //append it to the textbox
            }

            //ADD THE UNIT OF THE GIVEN PI TO THE DEFINITION TEXT BOX
            FixedGrid.addUnitToDefinition = function(pi_name)
            {
                var pair = new Object();
                pair.f = pi_name;
                pair.p = 'unit';
                if(dom.byId('txtBox_paramDef').value == '')
                    var pairString = JSON.stringify(pair);
                else if (dom.byId('txtBox_paramDef').value[dom.byId('txtBox_paramDef').value.length-1] == ';')
                    var pairString = JSON.stringify(pair);
                else    
                    var pairString = ';' + JSON.stringify(pair);

                var addThis = pairString; // This is the text string to add to the textbox
                dom.byId('txtBox_paramDef').value += addThis; //append it to the textbox
            }

            //BUILD THE GRID WITH THE GIVEN PARAMETERS
            FixedGrid.buildGrid = function(fields)
            {
                //DEFINE THE LAYOUT
                var layout = [[
                  {'name': '#', 'field': 'id', 'width': '5%'},
                  {'name': 'Parameter', 'field': 'pi_name', 'width': '45%'},
                  {'name': 'Value', 'field': 'pi_value', 'width': '20%'},
                  {'name': 'Unit', 'field': 'pi_unit', 'width': '20%'}
                ]];

                //FILL THE STORE WITH THE DATA
                for(var i = 0; i < fields.length; i++)
                {
                    fixedMemStore.put(lang.mixin(
                        { id: i }, 
                        fields[i]
                    ));
                }

                //CREATE THE DOJO GRID AND RENDER IT
                var grid = new DataGrid({
                    store: fixedDataStore,
                    structure: layout,
                selectionMode: 'single'}, 'FixedGridDiv');
                grid.startup(); //RENDER

                //REGISTER NOTIFY EVENT TO REFRESH THE GRID
                dojo.connect(fixedMemStore, 'notify', function(){grid._refresh()});

                //UPDATE THE DIV AND THE SELECTION PROPERTY
                function reportSelection(node)
                {
                    var items = this.selection.getSelected();
                    FixedGrid.selected_fields = items;
                    if(FixedGrid.selected_fields.length > 0)
                    {
                        var msg = "You have selected " + ((FixedGrid.selected_fields.length > 1) ? " ": " ");
                    }
                    else
                        return;
                    
                    var pi_names = baseArray.map(items, function(item)
                    {
                        return item.pi_name;
                    }, this);
                    node.innerHTML = msg + pi_names.join(", ");
                }

                //REGISTER SELECTION_CHANGE WITH REPORTSELECTION METHOD                
                grid.on("SelectionChanged", 
                    lang.hitch(grid, reportSelection, dom.byId("serverResponse")), true);

                //REGISTER DOUBLE CLICK EVENT WITH THE DEFINED FUNCTION
                //THE FUNCTION GETS PI NAME OF THE DOUBLE CLICKED ROW AND PASSES
                //IT TO A FUNCTION TO ADD ADD A PROPERTY TO THE DEFINITION
                dojo.connect(grid,"onCellDblClick", function(e)
                    {
                        var column = e.target.cellIndex;
                        var pi_name = fixedMemStore.get(e.rowIndex).pi_name;
                        if(column == 2)
                            FixedGrid.addValueToDefinition(pi_name);
                        else if(column == 3)
                            FixedGrid.addUnitToDefinition(pi_name);
                        else
                            return;       
                    });

                //GLOBALIZE STORE DATA AND THE GRID
                window.fixedData = fixedMemStore.data;
                window.fixedGrid = grid;
            }

            /********************************     End of Fixed PI Grid      *********************************/

            /********************************     Computed PI Grid      *********************************/

            //OBJECT TO ASSOCIATE THE COMP PI FUNCTIONS AND PROPERTIES
            var CompGrid = new Object();

            //ADDS THE DEFINITION OF GIVEN GRID ID TO THE DEFINITION TEXT BOX
            CompGrid.addGridDefToDefinition = function(id)
            {
                item = compMemStore.get(id); //get the item by the given id
                var def = item.pi_def[0];
                if(dom.byId('txtBox_paramDef').value == '')
                    var addString = def;
                else if (dom.byId('txtBox_paramDef').value[dom.byId('txtBox_paramDef').value.length-1] == ';')
                    var addString = def;
                else    
                    var addString = ';' + def;

                dom.byId('txtBox_paramDef').value += addString; //append it to the textbox
            }

            //BUILD THE GRID WITH THE GIVEN PARAMETERS
            CompGrid.buildGrid = function(fields)
            {
                //DEFINE THE LAYOUT
                var layout = [[
                  {'name': '#', 'field': 'id', 'width': '3%'},
                  {'name': 'Name', 'field': 'pi_name', 'width': '22%'},
                  {'name': 'Definition (truncated)', 'field': 'pi_def_trunc', 'width': '65%', }
                ]];

                //FILL THE STORE FOR THE GRID
                for(var i = 0; i < fields.length; i++)
                {
                    compMemStore.put(lang.mixin(
                        { id: i }, 
                        fields[i] 
                    ));
                    //truncate the definitions
                    var def = compMemStore.data[i].pi_def;
                    //compMemStore.data[i].pi_def_trunc = def.substring(0, .035*window.innerWidth) + ' ... ' +def.substring(def.length-20, def.length);
                    if(def.length > 20)
                        compMemStore.data[i].pi_def_trunc = def.substring(0, .035*window.innerWidth) + ' ... ' +def.substring(def.length-20, def.length)
                    else
                        compMemStore.data[i].pi_def_trunc = def;
                }

                //CREATE THE DOJO GRID AND RENDER IT
                var grid = new DataGrid({
                    store: compDataStore,
                    structure: layout,
                    selectionMode: 'single'}, 'CompGrid');
                grid.startup(); //RENDER

                //REGISTER MEMORY STORE'S NOTIFY EVENT TO REFRESH THE GRID
                dojo.connect(compMemStore, 'notify', function(){grid._refresh();});

                //UPDATE SELECTION PROPERTY AND REPORT THE SELECTION TO THE USER
                function reportSelection(node)
                    {
                        var items = this.selection.getSelected();
                        CompGrid.selected_fields = items;
                        if(CompGrid.selected_fields.length > 0)
                        {
                            var msg = "You have selected " + ((CompGrid.selected_fields.length > 1) ? " ": " ");
                        }
                        else
                            return;

                        var pi_names = baseArray.map(items, function(item)
                        {
                            return item.pi_name;
                        }, this);
                        node.innerHTML = msg + pi_names.join(", ");
                    }

                //REGISTER GRID EVENT SELECTIONCHANGED TO THE REPORTSELECTION FUNCTION
                grid.on("SelectionChanged", 
                    lang.hitch(grid, reportSelection, dom.byId("serverResponse")), true);

                //REGISTER THE DOUBLE CLICK EVENT TO THE DEFINED FUNCTION
                //DOUBLE CLICKS GETS THE DEFINITION OF THE ITEM IN THE DOUBLE CLICKED ROW
                dojo.connect(grid,"onCellDblClick", grid, function(e)
                    {
                        var def = grid.store.getValue(grid.getItem(e.rowIndex), 'pi_def');
                        var column = e.target.cellIndex;
                        var pi_name = compMemStore.get(e.rowIndex).pi_name;
                        if(column == 2)
                        {
                            if(dom.byId('txtBox_paramDef').value == '')
                                var addString = def;
                            else if (dom.byId('txtBox_paramDef').value[dom.byId('txtBox_paramDef').value.length-1] == ';')
                                var addString = def;
                            else    
                                var addString = ';' + def;

                            dom.byId('txtBox_paramDef').value += addString;
                        }
                    });

                /*  REGISTER THE MOUSE_OVER EVENT TO DISPLAY THE DEFINITION IN A DIV ELEMENT  */
                dojo.connect(grid, "onRowMouseOver", function(e)
                {
                    //GET THE DEFINITION FROM THE ITEM IN THE GRID BEING HOVERED OVER
                    var definition = grid.store.getValue(grid.getItem(e.rowIndex), 'pi_def');
                    var parse_display = '';
                    var def_display = '';
                    if(!definition) //IF THERE ISN'T A VALUE, THEN ITS TYPE IS FIXED
                    {
                        parse_display = 'Not defined for fixed parameters';
                        def_display = 'Not defined for fixed parameters';
                    }
                    else
                    {
                        parse_display = parseDefinitionFieldToOutput(definition);
                        def_display = definition;
                    }
                    //UPDATE THE DIV ELEMENT FOR THE USER
                    dom.byId("defDisplay").innerHTML = "Definition of highlighted Parameter: " + def_display;
                    dom.byId("parseDisplay").innerHTML = "Parsed Definition: " + parse_display;
                });

                //GLOBALIZE THE GRID AND ITS DATA
                window.compData = compMemStore.data;
                window.compGrid = grid;
            }

            /********************************     End of Comp Field Grid      *********************************/

            /********************************     Text Boxes, Buttons, etc      *********************************/

            /*  TEXT BOXES  */
            var txtBox_paramName = registry.byId("txtBox_paramName");
            var txtBox_paramValue = registry.byId("txtBox_paramValue");
            var txtBox_paramUnit = registry.byId("txtBox_paramUnit");
            var txtBox_paramDef = registry.byId("txtBox_paramDef");
            var txtBox_paramOutput = registry.byId("txtBox_paramOutput");
            document.getElementById('txtBox_paramOutput').readOnly = 'readOnly';

            //FIXED RADIO BUTTON
            //IF CHECKED, THE USER IS ENTERING A NEW FIXED PI
            var radio_fixed = new RadioButton(
                {
                    checked: true,
                    value: "fixed",
                    name: "pi_type",
                    onChange: function()
                    {
                        if(this.checked == true)
                        {
                            dom.byId("fields_computed").style.display="none";
                            dom.byId("fields_paramProperties").style.display = "block";
                        }
                        else
                        {
                            dom.byId("fields_computed").style.display="block";
                            dom.byId("fields_paramProperties").style.display = "none";
                        }
                    }

                }, "radio_fixed");

            //COMP RADIO BUTTON
            //IF CHECKED, THE USER IS ENTERING A NEW COMP PI
            var radio_computed = new RadioButton(
                {
                    checked: false,
                    value: "computed",
                    name: "pi_type",
                    onChange: function()
                    {
                        if(this.checked == true)
                        {
                            dom.byId("fields_computed").style.display="block";
                            dom.byId("fields_paramProperties").style.display = "none";
                        }
                        else
                        {
                            dom.byId("fields_computed").style.display="none";
                            dom.byId("fields_paramProperties").style.display = "block";
                        }
                    }
                }, "radio_computed");

            //BUTTON TO GET PROPERTY OF FIXED PI
            var button_get_fixed_property = new Button(
            {
                label: 'Get Property', 
                onClick: function()
                {
                    if(!FixedGrid.selected_fields)
                        return alert("Select a Parameter from the grid first.\n\n\nTip:  Did you know Double Clicking a cell has the same affect?"); 
                    get_fixed_property(FixedGrid.selected_fields);
                },
            }, 'button_get_fixed_property');

            //FUNCTION TO GET THE NAME OF THE PI INTENDED FOR THE PROPERTY
            function get_fixed_property(selected)
            {
                var column = fixedGrid.focus.cell.index;
                var pi_name = selected[0].pi_name;
                if(column == 2)
                    FixedGrid.addValueToDefinition(pi_name);
                else if(column == 3)
                    FixedGrid.addUnitToDefinition(pi_name);
                else
                    return;       
            }

            //BUTTON TO REMOVE A FIXED PI
            var button_delete_fixed_pi = new Button(
            {
                label: 'Delete', 
                onClick: function()
                {
                    remove_pi(FixedGrid.selected_fields, 'fixed')
                },
            }, 'button_delete_fixed_pi');


            //BUTTON TO GET PROPERTY OF SELECTED COMP PI
            var button_get_comp_property = new Button(
            {
                label: 'Get Property', 
                onClick: function()
                {
                    if(!CompGrid.selected_fields)
                        return alert("Select a Parameter from the grid first.\n\n\nTip:  Did you know Double Clicking a cell has the same affect?"); 
                    get_comp_property(CompGrid.selected_fields);
                },
            }, 'button_get_comp_property');

            //FUNCTION GETS THE NAME OF THE SELECTED COMP PI AND CALLS ANOTHER FUNCTION TO ADD THE
            //DEFINITION TO THE TEXT BOX
            function get_comp_property(selected)
            {
                var def = selected[0].pi_def;
                if(dom.byId('txtBox_paramDef').value == '')
                    var addString = def;
                else if (dom.byId('txtBox_paramDef').value[dom.byId('txtBox_paramDef').value.length-1] == ';')
                    var addString = def;
                else    
                    var addString = ';' + def;

                dom.byId('txtBox_paramDef').value += addString;
            }

            //BUTTON TO DELETE THE SELECTED COMP PI
            var button_delete_comp_pi = new Button(
            {
                label: 'Delete', 
                onClick: function()
                {
                    if(!CompGrid.selected_fields)
                        return alert("Select a Parameter from the grid first.\n\n\nTip:  Did you know Double Clicking a cell has the same affect?"); 
                    remove_pi(CompGrid.selected_fields, 'comp');
                },
            }, 'button_delete_comp_pi');

            //BUTTON TO SUBMIT A NEW PI            
            var button_add_new_PI = new Button(
            {
                label: 'Confirm',
                onClick: function()
                {
                    //REQUIREMENTS FOR A VALID NEW PI
                    if(dom.byId("txtBox_paramName").value=="")
                    {
                         dom.byId("serverResponse").innerHTML = "Enter a name into the name field";
                    }
                    else if(dom.byId("txtBox_paramValue").value=="" && radio_computed.checked == false)
                    {
                         dom.byId("serverResponse").innerHTML = "Enter a value into the value field";
                    }
                    // else if(dom.byId("txtBox_paramUnit").value=="" && radio_computed.checked == false)
                    // {
                    //      dom.byId("serverResponse").innerHTML = "Enter a unit of measure into the UOM field";
                    // }
                    else if(radio_computed.checked == true && dom.byId('txtBox_paramDef').value == "")
                    {
                         dom.byId("serverResponse").innerHTML = "Enter a definition for the computed field";
                    }
                    else
                    {
                        //NEW FIXED PI
                        if(!radio_computed.checked)
                        {
                            var temp_unit = dom.byId("txtBox_paramUnit").value;
                            if(temp_unit=="")
                                temp_unit = null
                            var pi = {
                                pi_name: dom.byId('txtBox_paramName').value,
                                pi_type: 'fixed',
                                pi_value: dom.byId('txtBox_paramValue').value,
                                pi_unit: temp_unit,
                                pi_def: null,
                            }
                            new_pi(pi);
                        }
                        else //NEW COMP PI
                        {
                            var pi = {
                                pi_name: dom.byId('txtBox_paramName').value,
                                pi_type: 'computed',
                                pi_value: null,
                                pi_unit: null,
                                pi_def: dom.byId('txtBox_paramDef').value,
                            }
                            new_pi(pi);
                        }
                    }
                }
            }, 'button_add_new_PI');

            //FUNCTION SUBMITS THE NEW PI TO THE SERVER
            //IF THE SERVER SUCCEEDS, THE SERVER RETURNS THE OBJECT
            //AND THE OBJECT IS ADDED TO THE APPROPRIATE STORE
            new_pi = function(pi)
            {
                if(!pi) //IF THE PI IS NULL, SOMETHING IS WRONG.
                {
                    alert('There was an error adding the new PI.');
                    return;
                }
                //SEND THE NEW PI TO THE SERVER
                xhr.get(
                {
                    url:"/individual", 
                    handleAs: 'json',
                    content: 
                    {
                        action: 'new_pi',
                        pi: JSON.stringify(pi),
                        loaded: has_loaded=true,
                    },
                    load:function(response)
                    {
                        //UPDATE THE SERVER RESPONSE DIV, CLEAR FIELDS, AND ADD THE OBJECT TO THE STORE
                        dom.byId("serverResponse").innerHTML = "Response from server: " + pi.pi_name + " successfully added.";
                        ClearTextFields();
                        if(pi.pi_type == 'fixed')
                            add_to_fixed_store(response);
                        else
                            add_to_comp_store(response);
                    },
                    error:function(error)
                    {
                        //IF THERE'S AN ERROR, REPORT IT.
                        console.log("There was an error: \n"+error);
                        alert('There was an error adding the new PI: ' + error);
                        dom.byId("serverResponse").innerHTML = "Response from server: " + error;
                    }
                });

                //ADD A PI TO THE FIXED PI STORE
                add_to_fixed_store = function(pi)
                {
                    var pi = new Object(pi);
                    var index = fixedMemStore.data.length;
                    fixedMemStore.put(lang.mixin(
                        {id: index}, 
                        pi
                    )); 
                }

                //ADD A PI TO THE COMP PI STORE
                add_to_comp_store = function(pi)
                {
                    var index = compMemStore.data.length;
                    var _pi = new Object(pi);
                    var def = _pi.pi_def;
                    if(def.length > 20)
                        _pi.pi_def_trunc = def.substring(0, .035*window.innerWidth) + ' ... ' +def.substring(def.length-20, def.length)
                    else
                        _pi.pi_def_trunc = _pi.pi_def;

                    compMemStore.put(lang.mixin(
                            {id: index}, 
                            _pi
                    ));
                }
            }

            //SEND REQUEST TO SERVER TO REMOVE THE GIVEN PI
            remove_pi = function(selected, type)
            {
                if(!selected)
                    return;

                if(!selected[0]){ return alert('error deleting \''+selected[0].pi_name+'\''); }
                if(!confirm("Are you sure you want to delete \'" + selected[0].pi_name +"\'?"))
                    return;
                //STORE THE STORE INDEX OF THE PI SO WE CAN REMOVE IT FROM THE STORE ON A REPORTED SUCCESS
                var index = selected[0].id;
                //REQUEST SERVER TO REMOVE
                xhr.get(
                {
                    url:"/individual",
                    content: 
                    {
                        action: 'remove_pi',
                        pi: JSON.stringify(selected[0]),
                        loaded: has_loaded=true,
                    },
                    load:function(response)
                    {
                        //UPDATE SERVER RESPONSE DIV AND REMOVE THE PI FROM THE STORE
                        dom.byId("serverResponse").innerHTML = "Response from server: " + response;
                        if(type == 'fixed')
                            remove_from_fixed_store();
                        else
                            remove_from_comp_store();
                    },
                    error:function(error)
                    {
                        //REPORT THE ERROR
                        console.log("There was an error: \n"+error);
                        dom.byId("serverResponse").innerHTML = "Response from server: " + error;
                    }
                });

                //REMOVE THE PI FROM THE FIXED STORE
                remove_from_fixed_store = function()
                {
                    fixedMemStore.remove(selected[0].id);
                }
                //REMOVE THE PI FROM THE COMP STORE
                remove_from_comp_store = function()
                {
                    compMemStore.remove(selected[0].id);
                }
            }

            //BUTTON TO PARSE THE DEFINITION OF THE DEFINITION TEXT BOX
            var button_ParseDefinition = new Button (
            {
                label: "Parse",
                onClick: function()
                {
                    var definition = dom.byId("txtBox_paramDef").value;
                    var output = parseDefinitionFieldToOutput(definition);
                    dom.byId("txtBox_paramOutput").value = output;
                }
            }, "button_ParseDefinition");

            //PARSE THE GIVEN DEFINITION STRING
            function parseDefinitionFieldToOutput(definition)
            {
                //SPLIT THE STRING BY ';' AND STORE THE ELEMENTS IN AN ARRAY
                var def_elements = definition.split(";");

                //AN ARRAY TO MAKE UP THE PARSED ELEMENTS OF THE OUTPUT STRING
                var output_elements = [];

                //QUERY THE STORE FOR ALL PIs
                var pis = fullDbMemStore.query({type: 'param_individual'});

                //STRING FOR FINAL OUTPUT
                var output = '';

                //IF THERE ARE NO PIs OR THE ARRAY IS NULL,
                //REPORT AN ERROR
                if(pis.length < 1 || pis == null)
                {
                    output = 'There was a problem acquiring the parameters';
                    console.log('Parse Error: ' + output);
                    return output;
                } 
                //WHILE ELEMENTS REMAIN
                while(def_elements.length > 0)
                {
                    //FLAG FOR WHEN AN ELEMENT IS MATCHED
                    var not_found = true;
                    //TEMP VARIABLE TO STORE A GRABBED PROPERTY
                    var temp_property;

                    //GET THE NEXT ELEMENT FROM THE ARRAY
                    var element = def_elements.shift();

                    //TRY TO PARSE THE ELEMENT TO A JSON OBJECT
                    try
                    {
                        element = eval("("+element+")");
                    }
                    catch(error) //CATCH ANY ERRORS
                    {
                        //IF THE ERROR IS A SYNTAX ERROR, THAT'S NORMAL,
                        //ADD THE ELEMENT TO THE OUTPUT AND CONTINUE
                        if(error = SyntaxError)
                        {
                            output_elements = add_element(output_elements, element);
                            continue;
                        }
                        else //OTHERWISE, REPORT THE ERROR
                        {
                            console.log('Error:' + error);
                        }
                    }

                    //IF THE ELEMENT HAS AN 'f' PROPERTY
                    if(element.f != null)
                    {
                        //FOR EVERY PI, TRY TO MATCH THE 'f' PROPERTY TO A PI NAME
                        for(var i = 0; i < pis.length; i++)
                        {
                            //IF A MATCH IS FOUND, CHECK WHICH PROPERTY WE'RE LOOKING FOR
                            //AND GET THE APPROPRIATE VALUE FROM THE MATCHED PI
                            if(element.f == pis[i].pi_name)
                            {
                                if(element.p == 'value')
                                    temp_property = pis[i].pi_value;
                                else
                                    temp_property = pis[i].pi_unit;

                                //IF THE PROPERTY IS NULL, SET THE PROPERTY TO AN EMPTY STRING
                                if(temp_property == null)
                                    temp_property = '';

                                //ADD THE PROPERTY TO THE OUTPUT
                                output_elements = add_element(output_elements, temp_property);

                                //FLAG THAT WE FOUND A MATCH AND BREAK THE LOOP
                                not_found = false;
                                break;
                            }
                        }
                        //IF WE GET HERE AND THERE'S NO MATCH, IT DOESN'T EXIST IN THE STORE
                        //ADD A 'NO MATCH' TO THE OUTPUT
                        if(not_found)
                        {
                            output_elements = add_element(output_elements, '(No Match for: ' + element.f + ' - ' + element.p + ')');
                        }
                    }
                    else //IF IT'S NULL, WE PROBABLY HAVE A MATH EQUATION..EVALUTE IT AND ADD IT TO THE OUTPUT
                    {
                        output_elements = add_element(output_elements, eval(element));
                    }
                }
                //IF THERE ARE NO MORE ELEMENTS BUILD THE STRING AND RETURN IT
                if(def_elements.length < 1)
                {
                    output = build_output_string(output_elements);
                    return output;
                }
                else //IF WE GET HERE AND HAVEN'T REPORTED THE STRING AND WE STILL HAVE ELEMENTS, THERE'S AN ERROR
                {
                    output = 'An unknown error occurred parsing the definition.';
                    console.log(output);
                    alert(output);
                    return output;
                }
            }

            //ADD THE GIVEN ELEMENT TO THE GIVEN OUTPUT ARRAY
            function add_element(output_elements, element)
            {
                output_elements.push(element);
                return output_elements;       
            }

            //BUILD THE OUTPUT STRING WITH THE GIVEN ARRAY OF STRINGS
            function build_output_string(output_elements)
            {
                var output_string = '';
                for (var i = 0; i < output_elements.length; i++)
                    output_string += output_elements[i];
                try
                {
                    output_string = eval(output_string);
                }
                catch(error)
                {
                    //if there's an error, ignore it and return the string as it was.
                }
                return output_string
            }

            //CLEAR ALL TEXT FIELDS
            function ClearTextFields()
            {
                dom.byId("txtBox_paramDef").value = "";
                dom.byId("txtBox_paramOutput").value = "";
                dom.byId("txtBox_paramName").value = "";
                dom.byId("txtBox_paramValue").value = "";
                dom.byId("txtBox_paramUnit").value = "";
            }

            //ON LOAD, CLEAR TEXT FIELDS AND GET ALL THE DATA
            ClearTextFields();
            GetFullDbStore();
        });
