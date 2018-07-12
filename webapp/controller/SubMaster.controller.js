/*global history */
sap.ui.define([
		"sap/ui/demo/masterdetail/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/m/GroupHeaderListItem",
		"sap/ui/Device",
		"sap/ui/demo/masterdetail/model/formatter",
		"sap/ui/demo/masterdetail/model/grouper",
		"sap/ui/demo/masterdetail/model/GroupSortState"
	], function (BaseController, JSONModel, Filter, FilterOperator, GroupHeaderListItem, Device, formatter, grouper, GroupSortState) {
		"use strict";

		return BaseController.extend("sap.ui.demo.masterdetail.controller.SubMaster", {

			formatter: formatter,

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			/**
			 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
			 * @public
			 */
			onInit : function () {
				// Control state model
				var oList = this.byId("materiallist"),
					oViewModel = this._createViewModel(),
					// Put down master list's original value for busy indicator delay,
					// so it can be restored later on. Busy handling on the master list is
					// taken care of by the master list itself.
					iOriginalBusyDelay = oList.getBusyIndicatorDelay();

				this._oGroupSortState = new GroupSortState(oViewModel, grouper.groupUnitNumber(this.getResourceBundle()));
				
				this._oList = oList;
			
				// keeps the filter and search state
				this._oListFilterState = {
					aFilter : [],
					aSearch : []
				};
	
				this.PlantID = "";
				this.CostCenterID = "";
				this.setModel(oViewModel, "masterView");
				// Make sure, busy indication is showing immediately so there is no
				// break after the busy indication for loading the view's meta data is
				// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
				oList.attachEventOnce("updateFinished", function(){
					// Restore original busy indicator delay for the list
					oViewModel.setProperty("/delay", iOriginalBusyDelay);
				});
	
				/*this.getView().addEventDelegate({
					onBeforeFirstShow: function () {
						this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
					}.bind(this)
				});
				*/
				
				//oList.attachUpdateFinished(null,this._listUpdated,this);
				if (!sap.ui.Device.system.phone) {
					this.getRouter().getRoute("submaster").attachPatternMatched(this._onMasterMatched, this);
				} else{
					//this.getRouter().getRoute("submobile").attachPatternMatched(this._onMasterMatched, this);
					this.getRouter().getRoute("submasterpage").attachPatternMatched(this._onMasterMatched, this);
				}
				this.getRouter().attachBypassed(this.onBypassed, this);
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

			/**
			 * After list data is available, this handler method updates the
			 * master list counter and hides the pull to refresh control, if
			 * necessary.
			 * @param {sap.ui.base.Event} oEvent the update finished event
			 * @public
			 */
			onUpdateFinished : function (oEvent) {
				// update the master list object counter after new data is loaded
				this._updateListItemCount(oEvent.getParameter("total"));
				this._listUpdated();
				// hide pull to refresh if necessary
				this.byId("pullToRefresh").hide();
			
			},

			/**
			 * Event handler for the master search field. Applies current
			 * filter value and triggers a new search. If the search field's
			 * 'refresh' button has been pressed, no new search is triggered
			 * and the list binding is refresh instead.
			 * @param {sap.ui.base.Event} oEvent the search event
			 * @public
			 */
			onSearch : function (oEvent) {
				if (oEvent.getParameters().refreshButtonPressed) {
					// Search field's 'refresh' button has been pressed.
					// This is visible if you select any master list item.
					// In this case no new search is triggered, we only
					// refresh the list binding.
					this.onRefresh();
					return;
				}

				var sQuery = oEvent.getParameter("query");
				var regNumeric = /^\d+$/;
				
				
				if (sQuery) {
					
					if (regNumeric.test(sQuery)) {
						this._oListFilterState.aSearch = [
							new Filter("PlantID", FilterOperator.EQ, this.PlantID),
							new Filter("MaterialID", FilterOperator.Contains, sQuery)
						];	
					} else {
						this._oListFilterState.aSearch = [
							new Filter("PlantID", FilterOperator.EQ, this.PlantID),
							new Filter("MaterialText", FilterOperator.Contains, sQuery)
						];
					}
				} else {
					this._oListFilterState.aSearch = [new Filter("PlantID", FilterOperator.EQ, this.PlantID)];
				}
				
				this._applyFilterSearch();

			},

			/**
			 * Event handler for refresh event. Keeps filter, sort
			 * and group settings and refreshes the list binding.
			 * @public
			 */
			onRefresh : function () {
				this._oList.getBinding("items").refresh();
			},

			/**
			 * Event handler for the sorter selection.
			 * @param {sap.ui.base.Event} oEvent the select event
			 * @public
			 */
			onSort : function (oEvent) {
				var sKey = oEvent.getSource().getSelectedItem().getKey(),
					aSorters = this._oGroupSortState.sort(sKey);

				this._applyGroupSort(aSorters);
			},

			/**
			 * Event handler for the grouper selection.
			 * @param {sap.ui.base.Event} oEvent the search field event
			 * @public
			 */
			onGroup : function (oEvent) {
				var sKey = oEvent.getSource().getSelectedItem().getKey(),
					aSorters = this._oGroupSortState.group(sKey);

				this._applyGroupSort(aSorters);
			},

			/**
			 * Event handler for the filter button to open the ViewSettingsDialog.
			 * which is used to add or remove filters to the master list. This
			 * handler method is also called when the filter bar is pressed,
			 * which is added to the beginning of the master list when a filter is applied.
			 * @public
			 */
			onOpenViewSettings : function () {
				if (!this._oViewSettingsDialog) {
					this._oViewSettingsDialog = sap.ui.xmlfragment("sap.ui.demo.masterdetail.view.ViewSettingsDialog", this);
					this.getView().addDependent(this._oViewSettingsDialog);
					// forward compact/cozy style into Dialog
					this._oViewSettingsDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
				}
				this._oViewSettingsDialog.open();
			},

			/**
			 * Event handler called when ViewSettingsDialog has been confirmed, i.e.
			 * has been closed with 'OK'. In the case, the currently chosen filters
			 * are applied to the master list, which can also mean that the currently
			 * applied filters are removed from the master list, in case the filter
			 * settings are removed in the ViewSettingsDialog.
			 * @param {sap.ui.base.Event} oEvent the confirm event
			 * @public
			 */
			onConfirmViewSettingsDialog : function (oEvent) {
				var aFilterItems = oEvent.getParameters().filterItems,
					aFilters = [],
					aCaptions = [];

				// update filter state:
				// combine the filter array and the filter string
				aFilterItems.forEach(function (oItem) {
					switch (oItem.getKey()) {
						case "Filter1" :
							aFilters.push(new Filter("UnitNumber", FilterOperator.LE, 100));
							break;
						case "Filter2" :
							aFilters.push(new Filter("UnitNumber", FilterOperator.GT, 100));
							break;
						default :
							break;
					}
					aCaptions.push(oItem.getText());
				});

				this._oListFilterState.aFilter = aFilters;
				this._updateFilterBar(aCaptions.join(", "));
				this._applyFilterSearch();
			},

			/**
			 * Event handler for the list selection event
			 * @param {sap.ui.base.Event} oEvent the list selectionChange event
			 * @public
			 */
			onSelectionChange : function (oEvent) {
				
				//this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
			},

			/**
			 * Event handler for the bypassed event, which is fired when no routing pattern matched.
			 * If there was an object selected in the master list, that selection is removed.
			 * @public
			 */
			onBypassed : function () {
				this._oList.removeSelections(true);
			},

			/**
			 * Used to create GroupHeaders with non-capitalized caption.
			 * These headers are inserted into the master list to
			 * group the master list's items.
			 * @param {Object} oGroup group whose text is to be displayed
			 * @public
			 * @returns {sap.m.GroupHeaderListItem} group header with non-capitalized caption.
			 */
			createGroupHeader : function (oGroup) {
				return new GroupHeaderListItem({
					title : oGroup.text,
					upperCase : false
				});
			},

			/**
			 * Event handler for navigating back.
			 * We navigate back in the browser historz
			 * @public
			 */
			onNavBack : function() {
				history.go(-1);
				//this.getRouter().navTo('master',false);
			},
			
			
			onMultiSelectPress: function(oEvent){
				this.getView().byId("materiallist").removeSelections();
				if (oEvent.getSource().getPressed()) {
					
					this.getView().byId("materiallist").setMode('MultiSelect');
				} else {
					this.getView().byId("materiallist").setMode('SingleSelectMaster');
				}
			},
			
			onAddItemPress: function(oEvent){
				
					
					
				var jsonData = [];
				
				
				 
				this._oList.getSelectedItems().some(function(item){
					
					var oCtx = item.getBindingContext();
					
					
					var oItem = {
						"MaterialGroupID" : "",
						"MaterialID" : "",
						"MaterialText" : "",
						"UnitPrice" : 0,
						"Currency" : "",
						"PriceUnit" : 0,
						"Day0": { "PRID" :"", "Date" : null, "Quantity" : 0, "UOM" : oCtx.getProperty("UnitOfMeasure")},
						"Day1": { "PRID" :"", "Date" : null, "Quantity" : 0, "UOM" : oCtx.getProperty("UnitOfMeasure")},
						"Day2": { "PRID" :"", "Date" : null, "Quantity" : 0, "UOM" : oCtx.getProperty("UnitOfMeasure")},
						"Day3": { "PRID" :"", "Date" : null, "Quantity" : 0, "UOM" : oCtx.getProperty("UnitOfMeasure")},
						"Day4": { "PRID" :"", "Date" : null, "Quantity" : 0, "UOM" : oCtx.getProperty("UnitOfMeasure")},
						"Day5": { "PRID" :"", "Date" : null, "Quantity" : 0, "UOM" : oCtx.getProperty("UnitOfMeasure")},
						"Day6": { "PRID" :"", "Date" : null, "Quantity" : 0, "UOM" : oCtx.getProperty("UnitOfMeasure")},
						"Day7": { "PRID" :"", "Date" : null, "Quantity" : 0, "UOM" : oCtx.getProperty("UnitOfMeasure")},
						"Day8": { "PRID" :"", "Date" : null, "Quantity" : 0, "UOM" : oCtx.getProperty("UnitOfMeasure")},
						"Day9": { "PRID" :"", "Date" : null, "Quantity" : 0, "UOM" : oCtx.getProperty("UnitOfMeasure")},
						"Day10": { "PRID" :"", "Date" : null, "Quantity" : 0, "UOM" : oCtx.getProperty("UnitOfMeasure")},
						"Day11": { "PRID" :"", "Date" : null, "Quantity" : 0, "UOM" : oCtx.getProperty("UnitOfMeasure")},
						"Day12": { "PRID" :"", "Date" : null, "Quantity" : 0, "UOM" : oCtx.getProperty("UnitOfMeasure")},
						"Day13": { "PRID" :"", "Date" : null, "Quantity" : 0, "UOM" : oCtx.getProperty("UnitOfMeasure")}
					};
					
					oItem.MaterialGroupID = oCtx.getProperty("MaterialGroupID");
					oItem.MaterialID = oCtx.getProperty("MaterialID");
					
					oItem.UnitPrice = parseFloat(oCtx.getProperty("NetPrice"));
					oItem.PriceUnit = parseFloat(oCtx.getProperty("PriceUnit"));
					oItem.MinOrder = parseFloat(oCtx.getProperty("MinOrder"));
					oItem.OrderUnit = oCtx.getProperty("OrderUnit");
					oItem.FactorToUOM = oCtx.getProperty("FactorToUOM");
					oItem.AllowDec = oCtx.getProperty("AllowDec");
					oItem.InTemplate = oCtx.getProperty("InTemplate");
					oItem.TemplatePRID = oCtx.getProperty("TemplatePRID");
					
					oItem.MaterialText = oCtx.getProperty("MaterialText");
					oItem.Currency = oCtx.getProperty("Currency");
					oItem.UOM = oCtx.getProperty("UnitOfMeasure");
					
					jsonData.push(oItem);
					
					
				});
				
				
				sap.ui.getCore().getEventBus().publish("marketlist", "addMaterial", {data : jsonData}); 
				if (sap.ui.Device.system.phone) {
					history.go(-2);
				}
			},

			/* =========================================================== */
			/* begin: internal methods                                     */
			/* =========================================================== */
		
		

			_createViewModel : function() {
				return new JSONModel({
					isFilterBarVisible: false,
					filterBarLabel: "",
					delay: 0,
					title: this.getResourceBundle().getText("submasterTitleCount", [0]),
					noDataText: this.getResourceBundle().getText("submasterListNoDataText"),
					sortBy: "MaterilGroupName",
					groupBy: "None"
				});
			},

			/**
			 * If the master route was hit (empty hash) we have to set
			 * the hash to to the first item in the list as soon as the
			 * listLoading is done and the first item in the list is known
			 * @private
			 */
			_onMasterMatched :  function(oEvent) {
				var objectId =  oEvent.getParameter("arguments").groupId;
				var plantId =  oEvent.getParameter("arguments").plantId;
				var costcenterId = oEvent.getParameter("arguments").ccId ;
				
				/*this.getModel().metadataLoaded().then( function() {
					var sObjectPath = this.getModel().createKey("MaterialGroups", {
						MaterialGroupID :  objectId
					});
					this._bindView("/" + sObjectPath );
				
				}.bind(this));
				*/
				var sObjectPath = this.getModel().createKey("/MaterialGroups", {
						MaterialGroupID :  objectId
				});
				
				
				var oList = this.getView().byId("materiallist");
				
				this.PlantID = plantId;
				this.CostCenterID = costcenterId;
				
				
				var oFilters = [];

				
				if (plantId){
				    oFilters.push( new Filter("PlantID", sap.ui.model.FilterOperator.EQ, plantId) );
				    if (costcenterId) {
				    	oFilters.push( new Filter("CostCenterID", sap.ui.model.FilterOperator.EQ, "'" + costcenterId + "'") );
				    }
				}
				
				
				var oItems = new sap.m.ObjectListItem({
					title : "{MaterialText}",
				    /*number: {	path: "PriceUnit",
								formatter: ".formatter.currencyValue"
							},
				    numberUnit: "{UnitOfMeasure}",
				    */
				    icon: "{= ${Locked} === true ? 'sap-icon://decline' : 'sap-icon://add-product'}",
					iconDensityAware: false,
					iconInset:false,
				    type: "Inactive",
				    attributes: [
			            new sap.m.ObjectAttribute({text: "ID: {MaterialID}"})
			        ],
			        firstStatus: new sap.m.ObjectStatus({text: "{= ${Locked} === true ? 'Not Available' : 'Available'}", state: "{= ${Locked} === true ? 'Error' : 'Success'}"})
			        //secondStatus: new sap.m.ObjectStatus({text: "Second status info"})
				    
				});
				
				oList.bindItems({
					path : sObjectPath + "/Materials",
					template: oItems,
    				filters: new Filter(oFilters,true)
				});
				
			},

			/**
			 * Binds the view to the object path. Makes sure that detail view displays
			 * a busy indicator while data for the corresponding element binding is loaded.
			 * @function
			 * @param {string} sObjectPath path to the object to be bound to the view.
			 * @private
			 */
			_bindView : function (sObjectPath) {
				// Set busy indicator during view binding
				var oViewModel = this.getModel("masterView");
				var oThis = this;

				// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
				oViewModel.setProperty("/busy", true);
				
				this.getView().bindElement({
					path : sObjectPath,
					events: {
						change : function() {
							oViewModel.setProperty("/busy", false);
							var plantId = 	oThis.getView().getBindingContext().getProperty("PlantID");
				
				
							var oList = oThis.getView().byId("materiallist");
							var oBinding = oList.getBinding("items");
							var aFilters = [];
			
							
							aFilters.push( new Filter("PlantID", FilterOperator.Contains, plantId) );
							
							oBinding.filter(aFilters, sap.ui.model.FilterType.Application);  
						},
						dataReceived: function () {
							oViewModel.setProperty("/busy", false);
						},
						dataRequested : function () {
							oViewModel.setProperty("/busy", true);
						}
					}
				});
			},
			_listUpdated: function(){
				/*var firstItem = this._oList.getItems()[0];
				if (firstItem) {
					this.getRouter().navTo("object", {
						groupId : firstItem.getBindingContext().getProperty("MaterialGroupID"),
						objectId : firstItem.getBindingContext().getProperty("MaterialID")
					}, false);
				} else{
					this.getRouter().getTargets().display("detailNoObjectsAvailable");
				}*/
			},
			
			/**
			 * Sets the item count on the master list header
			 * @param {int} iTotalItems the total number of items in the list
			 * @private
			 */
			_updateListItemCount : function (iTotalItems) {
				var sTitle;
				// only update the counter if the length is final
				if (this._oList.getBinding("items").isLengthFinal()) {
					sTitle = this.getResourceBundle().getText("submasterTitleCount", [iTotalItems]);
					this.getModel("masterView").setProperty("/title", sTitle);
				}
			},

			/**
			 * Internal helper method to apply both filter and search state together on the list binding
			 * @private
			 */
			_applyFilterSearch : function () {
				var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
				oViewModel = this.getModel("masterView");
				
				this._oList.getBinding("items").filter(aFilters, "Application");
				
				// changes the noDataText of the list in case there are no filter results
				if (aFilters.length !== 0) {
					oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
				} else if (this._oListFilterState.aSearch.length > 0) {
					// only reset the no data text to default when no new search was triggered
					oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
				}
			},

			/**
			 * Internal helper method to apply both group and sort state together on the list binding
			 * @param {sap.ui.model.Sorter[]} aSorters an array of sorters
			 * @private
			 */
			_applyGroupSort : function (aSorters) {
				this._oList.getBinding("items").sort(aSorters);
			},

			/**
			 * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
			 * @param {string} sFilterBarText the selected filter value
			 * @private
			 */
			_updateFilterBar : function (sFilterBarText) {
				var oViewModel = this.getModel("masterView");
				oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
				oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
			}

		});

	}
);