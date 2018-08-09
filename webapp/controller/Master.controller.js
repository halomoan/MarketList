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

		return BaseController.extend("sap.ui.demo.masterdetail.controller.Master", {

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
				var oList = this.byId("matgrouplist"),
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
				
				
				if (!sap.ui.Device.system.phone) {
					
					//var oLocalData = this.getLocalData();
					
					//if(oLocalData.UseMobile) {
						this.getRouter().getRoute("dmaster").attachPatternMatched(this._onMasterMatched, this);
					//} else {
						this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
						this.getRouter().getRoute("dsmaster").attachPatternMatched(this._onMasterMatched, this);
					//}
				} else {
					//this.getRouter().getRoute("mastermobile").attachPatternMatched(this._onMasterMatched, this);
					this.getRouter().getRoute("masterpage").attachPatternMatched(this._onMasterMatched, this);
				}
				this.getRouter().attachBypassed(this.onBypassed, this);
			},

			onUpdateFinished : function (oEvent) {
				// update the master list object counter after new data is loaded
				this._updateListItemCount(oEvent.getParameter("total"));
				// hide pull to refresh if necessary
				this.byId("pullToRefresh").hide();
			},

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
				
				if (sQuery) {
					this._oListFilterState.aSearch = [
						new Filter("MaterialGroupName", FilterOperator.Contains, sQuery)
					];
				} else {
					this._oListFilterState.aSearch = [	new Filter("MaterialGroupName", FilterOperator.Contains, sQuery) ];
				}
				this._applyFilterSearch();

			},

			onRefresh : function () {
				this._oList.getBinding("items").refresh();
			},

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
				// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
				this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
			},

			onListClick : function(oEvent) {
				this._showSubMaster(oEvent.getParameter("listItem") || oEvent.getSource());
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

			/**
			 * Event handler for navigating back.
			 * We navigate back in the browser historz
			 * @public
			 */
			onNavBack : function() {
				history.go(-1);
			},

			/* =========================================================== */
			/* begin: internal methods                                     */
			/* =========================================================== */
		
		

			_createViewModel : function() {
				return new JSONModel({
					isFilterBarVisible: false,
					filterBarLabel: "",
					delay: 0,
					title: this.getResourceBundle().getText("masterTitleCount", [0]),
					noDataText: this.getResourceBundle().getText("masterListNoDataText"),
					sortBy: "MaterilGroupName",
					groupBy: "None"
				});
			},

			_onMasterMatched :  function(oEvent) {

				this.oLocalData = this.getLocalData();
			
		
				var plantId = this.oLocalData.PlantID;
				var costcenterId = this.oLocalData.CostCenterID;
				
				if (this.PlantID !== plantId ) {
					var oList = this.getView().byId("matgrouplist");
					var oBinding = oList.getBinding("items");
					
					this.PlantID =  plantId;
					this.CostCenterID = costcenterId;
					var andFilters = [];
					
					
					if (plantId){
					    andFilters.push( new Filter({path: "PlantID",  operator: sap.ui.model.FilterOperator.EQ, value1: plantId}) );
					    if (costcenterId){
							andFilters.push( new Filter({path: "CostCenterID", operator: sap.ui.model.FilterOperator.EQ, value1: "'" + costcenterId + "'"}) );
						}	
					}
				
					oBinding.filter(new Filter( andFilters, true ));
					
				}
			},

			_showSubMaster : function(oItem) {
				var sObjectId = oItem.getBindingContext().getProperty("MaterialGroupID");
				
				this.getView().byId("matgrouplist").setSelectedItem(oItem, false);
				
				this.oLocalData = this.getLocalData();
				
				if (sObjectId === "TEMPLATE") {
					if (!sap.ui.Device.system.phone) {
							if(this.oLocalData.SourcePage === "planCal") {
								this.getRouter().navTo("subdsmaster", {groupId : sObjectId,template: "X" }, false);
							} else{
								if(this.oLocalData.UseMobile) {
									this.getRouter().navTo("subdmaster", {groupId : sObjectId,template: "X" }, false);
								} else {
								this.getRouter().navTo("submaster", {groupId : sObjectId,template: "X" }, false);
								}
							}
					} else {
						this.getRouter().navTo("submasterpage", {plantId: this.PlantID, groupId : sObjectId,ccId: this.CostCenterID }, false);
					}
				} else {
					
					if (!sap.ui.Device.system.phone) {
							if(this.oLocalData.SourcePage === "planCal") {
							
								this.getRouter().navTo("subdsmaster", {groupId : sObjectId}, false);
							} else{
									if(this.oLocalData.UseMobile) {
										this.getRouter().navTo("subdmaster", {groupId : sObjectId }, false);
									} else {
										this.getRouter().navTo("submaster", {groupId : sObjectId}, false);
									}
							}
						
					}else{
						this.getRouter().navTo("submasterpage", {plantId: this.PlantID, groupId : sObjectId}, false);
					}
				}
			
			},

			_updateListItemCount : function (iTotalItems) {
				var sTitle;
				// only update the counter if the length is final
				if (this._oList.getBinding("items").isLengthFinal()) {
					sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
					this.getModel("masterView").setProperty("/title", sTitle);
				}
			},

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

			_applyGroupSort : function (aSorters) {
				this._oList.getBinding("items").sort(aSorters);
			},

			_updateFilterBar : function (sFilterBarText) {
				var oViewModel = this.getModel("masterView");
				oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
				oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
			}

		});

	}
);