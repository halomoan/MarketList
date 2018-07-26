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
				this.setDeviceModel();
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
					var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
					var oLocalData = oStorage.get("localStorage");
					
					if(oLocalData.UseMobile) {
						this.getRouter().getRoute("subdmaster").attachPatternMatched(this._onMasterMatched, this);
					} else {
						this.getRouter().getRoute("submaster").attachPatternMatched(this._onMasterMatched, this);
						this.getRouter().getRoute("subdsmaster").attachPatternMatched(this._onMasterMatched, this);
					}
				} else{
					//this.getRouter().getRoute("submobile").attachPatternMatched(this._onMasterMatched, this);
					this.getRouter().getRoute("submasterpage").attachPatternMatched(this._onMasterMatched, this);
				}
				this.getRouter().attachBypassed(this.onBypassed, this);
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

		
			onUpdateFinished : function (oEvent) {
				// update the master list object counter after new data is loaded
				this._updateListItemCount(oEvent.getParameter("total"));
				this._listUpdated();
				// hide pull to refresh if necessary
				this.byId("pullToRefresh").hide();
			
			},

		
			onSearch : function (oEvent) {
				if (oEvent.getParameters().refreshButtonPressed) {
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

	
			onRefresh : function () {
				try {
					this._oList.getBinding("items").refresh();
				} catch(err){
					return;
				}
			},

		
			onSort : function (oEvent) {
				var sKey = oEvent.getSource().getSelectedItem().getKey(),
					aSorters = this._oGroupSortState.sort(sKey);

				this._applyGroupSort(aSorters);
			},

		
			onGroup : function (oEvent) {
				var sKey = oEvent.getSource().getSelectedItem().getKey(),
					aSorters = this._oGroupSortState.group(sKey);

				this._applyGroupSort(aSorters);
			},

		
			onOpenViewSettings : function () {
				if (!this._oViewSettingsDialog) {
					this._oViewSettingsDialog = sap.ui.xmlfragment("sap.ui.demo.masterdetail.view.ViewSettingsDialog", this);
					this.getView().addDependent(this._oViewSettingsDialog);
					// forward compact/cozy style into Dialog
					this._oViewSettingsDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
				}
				this._oViewSettingsDialog.open();
			},

		
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

		
			onSelectionChange : function (oEvent) {
				
				//this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
			},

			
			onBypassed : function () {
				this._oList.removeSelections(true);
			},

			createGroupHeader : function (oGroup) {
				return new GroupHeaderListItem({
					title : oGroup.text,
					upperCase : false
				});
			},

		
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
				
				var oLocalData = this.getLocalData();
				var oThis = this;
				var bClose = true;
				 
				this._oList.getSelectedItems().some(function(item){
					
					var oCtx = item.getBindingContext();
					
					if (oLocalData.isAutoPO && oCtx.getProperty("Locked")) {
						sap.m.MessageToast.show(oThis.getResourceBundle().getText("msgMaterialLocked",[oCtx.getProperty("MaterialText"),oCtx.getProperty("MaterialID")]));
						bClose = false;
					} else {
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
					}	
						
				});
					
				if(jsonData.length > 0){	
					sap.ui.getCore().getEventBus().publish("marketlist", "addMaterial", {data : jsonData}); 
				}
				
				if (sap.ui.Device.system.phone) {
					if (bClose) {
						history.go(-2);
					}
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
			
				var oLocalData = this.getLocalData(); 
				
				var objectId =  oEvent.getParameter("arguments").groupId;
				var template =  oEvent.getParameter("arguments").template;
				var plantId =  oLocalData.PlantID;
				var costcenterId = oLocalData.CostCenterID;
				
				var sObjectPath = this.getModel().createKey("/MaterialGroups", {
						MaterialGroupID :  objectId
				});
				
				
				var oList = this.getView().byId("materiallist");
				
				this.PlantID = plantId;
				this.CostCenterID = costcenterId;
				
				var oFilters = [];

				
				if (plantId){
				    oFilters.push( new Filter("PlantID", sap.ui.model.FilterOperator.EQ, plantId) );
				    if (template === "X") {
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
				
				var oSort = this.byId("sort");
				var oSorter;
				
				if(oSort.getSelectedItem()){
					oSorter = new sap.ui.model.Sorter(oSort.getSelectedItem().getKey(), true);
				}
				
				oList.bindItems({
					path : sObjectPath + "/Materials",
					template: oItems,
    				filters: new Filter(oFilters,true),
    				sorter: oSorter
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