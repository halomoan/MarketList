sap.ui.define([
	"sap/ui/demo/masterdetail/controller/BaseController",
	"sap/ui/model/json/JSONModel"
], function(BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("sap.ui.demo.masterdetail.controller.homeView", {
		storeSelection: function(){
			var oViewModel = this.getModel("detailView");
			if (!jQuery.sap.storage.isSupported()) {
				sap.m.MessageBox.error(this.getResourceBundle().getText("msgErrLocalStorage"), {
					title: "Error",
					initialFocus: null
				});
				return false;
			}
			
			var	oLocal = {};
			var oPlant = this.getView().byId("plant").getSelectedItem();
			if (oPlant) {
				oLocal.PlantID = oPlant.getProperty("key");
				oLocal.Plant = oPlant.getProperty("text");
				var sPath = oPlant.getBindingContext().getPath();
				var oData = oPlant.getModel().getProperty(sPath);
				if (oData) {
					oLocal.Currency = oData.Currency;
					oLocal.isAutoPO = oData.IsAutoPO;
				}
			} else {
				sap.m.MessageToast.show(this.getResourceBundle().getText("msgSelectPlant"));
				return false;
			}
			var oCostCenter = this.getView().byId("costcenter").getSelectedItem();
			if (oCostCenter) {
				oLocal.CostCenterID = oCostCenter.getProperty("key");
				oLocal.CostCenter = oCostCenter.getProperty("text");
			} else {
				sap.m.MessageToast.show(this.getResourceBundle().getText("msgSelectCC"));
				return false;
			}
			var oUnloadingPoint = this.getView().byId("unloadingpoint").getSelectedItem();
			
			if (oUnloadingPoint) {
				oLocal.UnloadingPointID = oUnloadingPoint.getProperty("key");
				oLocal.UnloadingPoint = oUnloadingPoint.getProperty("text");
				oLocal.MaxItemCost = parseFloat(oUnloadingPoint.data("MaxItemCost"));
				oLocal.ShowVendor = oUnloadingPoint.data("ShowVendor");
			} else {
				sap.m.MessageToast.show(this.getResourceBundle().getText("msgSelectUnloadingPoint"));
				return false;
			}

			var oUPointItems = this.getView().byId("unloadingpoint").getItems();
			var oUPoints = [];
			for(var i in oUPointItems) {
				oUPoints.push(oUPointItems[i].getKey());
				
			}
			
			oLocal.UPoints = JSON.stringify(oUPoints);
			
			var oDate = this.getView().byId("DP1");
			if (oDate.getValueState() === sap.ui.core.ValueState.Error) {
				sap.m.MessageToast.show(this.getResourceBundle().getText("msgWrongDateFuture"));
				return false;
			} else {
				oLocal.Date = oViewModel.getProperty("/Date");
			}

			var oUseMobile = this.getView().byId("chkMobile");
			if (oUseMobile.getSelected()) {
				oLocal.UseMobile = true;
			} else {
				oLocal.UseMobile = false;
			}
			this.putLocalData(oLocal);
			
			return true;
		},
		gotoForm: function() {
			if (this.storeSelection()){ 
			
				var oLocal = this.getLocalData();
				oLocal.SourcePage = null;
				this.putLocalData(oLocal);
				
				
				if (!sap.ui.Device.system.phone) {
					if (oLocal.UseMobile) {
						
						this.getRouter().navTo("dmaster", {
							plantId: oLocal.PlantID,
							ccId: oLocal.CostCenterID 
						}, true);
					} else {
						this.getRouter().navTo("master", {
							plantId: oLocal.PlantID,
							ccId: oLocal.CostCenterID 
						}, false);
					}
				} else {
					this.getRouter().navTo("mastermobile", {
						plantId: oLocal.PlantID,
						ccId: oLocal.CostCenterID 
					}, false);
				}
			}
		},
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf sap.ui.demo.masterdetail.view.homeView
		 */
		onInit: function() {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYY-MM-dd"
			});
			var oViewData = {
				busy: false,
				busyIndicatorDelay: 0,
				Date: dateFormat.format(new Date((new Date()).getTime() + (24 * 60 * 60 * 1000)))
			};

			var odetailView = new JSONModel(oViewData);
			this.setModel(odetailView, "detailView");
			this.setDeviceModel();
			
			this.clearLocalData();

			var oPlant = this.getView().byId("plant");
			var oItemSelectTemplate = new sap.ui.core.Item({
				key: "{PlantID}",
				text: "{PlantText}"
			});

			odetailView.setProperty("/busy", true);
			
			oPlant.bindItems({
				"path": "/PlantSet",
				"template": oItemSelectTemplate,
				"events": {
					
					dataReceived: function() {
						odetailView.setProperty("/busy", false);
						if(oPlant.getFirstItem()){
							oPlant.fireChange(oPlant.getFirstItem());
						}
					},
					dataRequested: function() {
						odetailView.setProperty("/busy", true);
					}
				}

			});

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

			//this.getRouter().getRoute("home").attachPatternMatched(this._onMasterMatched, this);
		},

		_onMetadataLoaded: function() {
			var oThis = this;
			
			
			this.getView().bindElement({
				path: "/UserProfileSet('USP001')",
				events: {
					dataReceived: function(rData) {
						var oData = rData.getParameter("data");
						if (oData) {

						
							var oLocalData = {};

							oLocalData.UserId = oData.UserId;
							oLocalData.Name = oData.Name;
							oLocalData.UserType = oData.UserType;
							oThis.putLocalData(oLocalData);
						}
					}
				}
			});

		},
		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf sap.ui.demo.masterdetail.view.homeView
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf sap.ui.demo.masterdetail.view.homeView
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf sap.ui.demo.masterdetail.view.homeView
		 */
		//	onExit: function() {
		//
		//	}
		_onMasterMatched: function() {

		},

		onPlantChange: function(oEvent) {

			var path;
			if (oEvent.getSource().getSelectedItem()) {
				path = oEvent.getSource().getSelectedItem().getBindingContext().getPath();
			} else {
				path = oEvent.getSource().getFirstItem().getBindingContext().getPath();
			}
			var oCostCenter = this.getView().byId("costcenter");
			var odetailView = this.getModel("detailView");

			var oItemSelectTemplate = new sap.ui.core.Item({
				key: "{CostCenterID}",
				text: "{CostCenterText}"
			});

			odetailView.setProperty("/busy", true);
			oCostCenter.bindAggregation("items", {
				"path": path + "/PlantToCC",
				"template": oItemSelectTemplate,
				"events": {
					dataReceived: function() {
						odetailView.setProperty("/busy", false);
						oCostCenter.fireChange(oCostCenter.getFirstItem());

					},
					dataRequested: function() {
						odetailView.setProperty("/busy", true);
					}
				}

			});
		},
		onCostCenterChange: function(oEvent) {
			var path;
			if (oEvent.getSource().getSelectedItem()) {
				path = oEvent.getSource().getSelectedItem().getBindingContext().getPath();
			} else {
				path = oEvent.getSource().getFirstItem().getBindingContext().getPath();
			}
			var oUnloadingPoint = this.getView().byId("unloadingpoint");
			var odetailView = this.getModel("detailView");

			var oItemSelectTemplate = new sap.ui.core.Item({
				key: "{UnLoadingPointID}",
				text: "{UnLoadingPoint}"
			});

			var oCustomData = new sap.ui.core.CustomData({key:"MaxItemCost"});
			oCustomData.bindProperty("value", "MaxItemCost");
			oItemSelectTemplate.addCustomData(oCustomData);
			
			var oShowVendor = new sap.ui.core.CustomData({key:"ShowVendor"});
			oShowVendor.bindProperty("value", "ShowVendor");
			oItemSelectTemplate.addCustomData(oShowVendor);
			
			odetailView.setProperty("/busy", true);
			oUnloadingPoint.bindAggregation("items", {
				"path": path + "/CCUnloadingPoint",
				"template": oItemSelectTemplate,
				"events": {
					dataReceived: function() {
						odetailView.setProperty("/busy", false);
					},
					dataRequested: function() {
						odetailView.setProperty("/busy", true);
					}
				}

			});
		},
		onDateChange: function(oEvent) {
			var oDP = oEvent.oSource;
			var bValid = oEvent.getParameter("valid");
			var dValue = new Date(oEvent.getParameter("value"));
			var today = new Date();

			if (bValid && today.getTime() < dValue.getTime()) {
				oDP.setValueState(sap.ui.core.ValueState.None);
			} else {
				oDP.setValueState(sap.ui.core.ValueState.Error);
			}

		},
		onPlanCalendar: function() {
		
			if (this.storeSelection()){ 
				var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
				var oLocal = oStorage.get("localStorage");
				this.getRouter().navTo("plancalendar", {
					plantId: oLocal.PlantID,
					ccId: oLocal.CostCenterID,
					date : oLocal.Date
				}, false);
			}	
		},
		logout:function(){
			$.ajax({  
				type: "GET",  
				url: "/sap/public/bc/icf/logoff"  //Clear SSO cookies: SAP Provided service to do that  
			}).done(function(){ //Now clear the authentication header stored in the browser  
				if (!document.execCommand("ClearAuthenticationCache")) {  
				//"ClearAuthenticationCache" will work only for IE. Below code for other browsers  
					$.ajax({  
						type: "GET",  
						url: "/sap/public/bc/icf/logoff", //any URL to a Gateway service  
						username: '', //dummy credentials: when request fails, will clear the authentication header  
						password: '',  
						statusCode: { 401: function() {  
							window.location.replace("/sap/bc/ui5_ui5/sap/zmarketlist/index.html");
						} },  
						error: function() {  
							window.location.replace("/sap/bc/ui5_ui5/sap/zmarketlist/index.html");
						}  
					}).done(function(){
						window.location.replace("/sap/bc/ui5_ui5/sap/zmarketlist/index.html");
					});  
				} else{
					window.location.replace("sap/bc/ui5_ui5/sap/zmarketlist/index.html");
				}  
			});
		}
		
	});

});