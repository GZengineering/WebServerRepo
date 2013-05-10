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

            function addToFullStore(object)
            {
                console.log('Adding:');
                console.log(object);
                fullDbMemStore.put(object);
                console.log(fullDbMemStore.data);
                paramStore.idProperty = 'name';
                var parameters = fullDbMemStore.query({type: 'param_class'});
                paramStore.setData(parameters); 
                paramGrid._refresh();
            }


            /********************************     Fixed PI Grid      *********************************/

            //OBJECT TO ASSOCIATE ALL FUNCTIONS AND PROPERTIES FOR THE FIXED PI GRID
            var ParamGrid = new Object();

            //BUILD THE GRID WITH THE GIVEN PARAMETERS
            ParamGrid.buildGrid = function()
            {
                //DEFINE THE LAYOUT
                var layout = [[
                  {'name': 'Parameter', 'field': 'name', 'width': '100%'},
                ]];

                var parameters = fullDbMemStore.query({type: 'param_class'});
                paramStore.setData(parameters);

                //CREATE THE DOJO GRID AND RENDER IT
                var grid = new DataGrid({
                    store: paramDataStore,
                    structure: layout,
                selectionMode: 'single'}, 'ParamGrid');
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

                //REGISTER DOUBLE CLICK EVENT WITH THE DEFINED FUNCTION
                //THE FUNCTION GETS PI NAME OF THE DOUBLE CLICKED ROW AND PASSES
                //IT TO A FUNCTION TO ADD ADD A PROPERTY TO THE DEFINITION
                // dojo.connect(grid,"onCellDblClick", function(e)
                //     {
                //         var column = e.target.cellIndex;
                //         var pi_name = paramStore.get(e.rowIndex).pi_name;
                //         if(column == 2)
                //             FixedGrid.addValueToDefinition(pi_name);
                //         else if(column == 3)
                //             FixedGrid.addUnitToDefinition(pi_name);
                //         else
                //             return;       
                //     });

                //GLOBALIZE STORE DATA AND THE GRID
                window.paramGrid = grid;
            }

            /********************************     End of Fixed PI Grid      *********************************/


            /********************************     Text Boxes, Buttons, etc      *********************************/

            /*  TEXT BOXES  */
            var txtBox_paramName = registry.byId("txtBox_paramName");
            var txtBox_paramValue = registry.byId("txtBox_paramValue");
            document.getElementById('txtBox_paramValue').readOnly = 'readOnly';
            

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


            //BUTTON TO SUBMIT A NEW PI            
            var button_add_new_param_class = new Button(
            {
                label: 'Submit New',
                onClick: function()
                {
                    //REQUIREMENTS FOR A VALID NEW PI
                    if(dom.byId("txtBox_paramName").value=="")
                    {
                         alert("Enter a name into the name field");
                         return;
                    }

                    var param_class = {};
                    param_class.name = dom.byId("txtBox_paramName").value;
                    param_class.value = null;
                    new_param_class(param_class);
                }
            }, 'button_add_new_param_class');

            //FUNCTION SUBMITS THE NEW PI TO THE SERVER
            //IF THE SERVER SUCCEEDS, THE SERVER RETURNS THE OBJECT
            //AND THE OBJECT IS ADDED TO THE APPROPRIATE STORE
            new_param_class = function(param_class)
            {
                if(!param_class) //IF THE PI IS NULL, SOMETHING IS WRONG.
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
                            alert('The Parameter Class \'' + param_class.name + '\' already exists.');
                            return;
                        }
                        //UPDATE THE SERVER RESPONSE DIV, CLEAR FIELDS, AND ADD THE OBJECT TO THE STORE
                        dom.byId("serverResponse").innerHTML = "Response from server: \'" + param_class.name + "\' successfully added.";
                        ClearTextFields();
                        addToFullStore(response);
                        console.log(response);
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
                if(!selected)
                    return;
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
                    var id = fullDbMemStore.getIdentity(param_class);
                    fullDbMemStore.remove(id);
                    var parameters = fullDbMemStore.query({type: 'param_class'});
                    // paramStore.data = new Array();
                    paramStore.setData(parameters); 
                    paramGrid._refresh();
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


            //CLEAR ALL TEXT FIELDS
            function ClearTextFields()
            {
                dom.byId("txtBox_paramName").value = "";
                dom.byId("txtBox_paramValue").value = "";
            }

            //ON LOAD, CLEAR TEXT FIELDS AND GET ALL THE DATA
            ClearTextFields();
            GetFullDbStore();
        });
