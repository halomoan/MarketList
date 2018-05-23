sap.ui.define([
<<<<<<< HEAD
<<<<<<< HEAD
	"sap/ui/demo/masterdetail/controller/BaseController",
	"sap/ui/model/json/JSONModel"
], function(BaseController,JSONModel) {
	"use strict";

	return BaseController.extend("sap.ui.demo.masterdetail.controller.homeView", {
		gotoForm: function(){

			var oData = {};
			var oPlant = this.getView().byId("plant").getSelectedItem();
			if(oPlant){
				oData.PlantID = oPlant.getProperty("key");
				oData.Plant = oPlant.getProperty("text");
			} else {
				sap.m.MessageToast.show(this.getResourceBundle().getText("msgSelectPlant"));
				return;
			}
			var oCostCenter = this.getView().byId("costcenter").getSelectedItem();
			if(oCostCenter){
				oData.CostCenterID = oCostCenter.getProperty("key");
				oData.CostCenter = oCostCenter.getProperty("text");
			} else {
				sap.m.MessageToast.show(this.getResourceBundle().getText("msgSelectCC"));	
				return;
			}
			var oUnloadingPoint = this.getView().byId("unloadingpoint").getSelectedItem();
			if(oUnloadingPoint){
				oData.UnloadingPointID = oUnloadingPoint.getProperty("key");
				oData.UnloadingPoint = oUnloadingPoint.getProperty("text");
			} else {
				sap.m.MessageToast.show(this.getResourceBundle().getText("msgSelectUnloadingPoint"));	
				return;
			}
			
			
				
			var oModel = this.getOwnerComponent().getModel();
			var sPath = "/" + oModel.createKey("MarketListSet",{PlantID: oPlant.getProperty("key"), CostCenterID : oCostCenter.getProperty("key"), UnLoadingPointID: oUnloadingPoint.getProperty("key")});
			
			var oThis = this;
			
			console.log(sPath);
			var oViewModel = this.getModel("viewModel");
			oViewModel.setProperty("/busy", true);
			oModel.read(sPath, {
			 method: "GET",
				    success: function(oResult) {
				    	oViewModel.setProperty("/busy", false);
				    	
				    	if (oResult) {
				    	  oThis.getRouter().navTo("master", {marketlistID : oResult.MarketListID}, false);
				    	}
				    	
				    	  
				    }
			});
			
			
		},
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf sap.ui.demo.masterdetail.view.homeView
		 */
		onInit: function() {
				var oViewData = {
					busy: false,
					busyIndicatorDelay : 10
				};
				var oViewModel = new JSONModel(oViewData);
				this.setModel(oViewModel, "viewModel");
				var oPlant = this.getView().byId("plant");
				var oItemSelectTemplate = new sap.ui.core.Item({
		            key : "{PlantID}",
		            text : "{Plant}"
    			});
				oPlant.bindItems({ 
					"path": "/PlantSet",
					"template" : oItemSelectTemplate,
					"events" : {
						dataReceived: function () {
							oViewModel.setProperty("/busy", false);
							
					},
						dataRequested : function () {
							oViewModel.setProperty("/busy", true);
						}
					}
					
				});
				
				this.getRouter().getRoute("home").attachPatternMatched(this._onMasterMatched, this);
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
		_onMasterMatched : function() {
		
		},
		
		onPlantChange: function(oEvent){
			var path = oEvent.oSource.getSelectedItem().getBindingContext().getPath();
			var oCostCenter = this.getView().byId("costcenter");
			var oViewModel = this.getModel("viewModel");
			
			var oItemSelectTemplate = new sap.ui.core.Item({
	            key : "{CostCenterID}",
	            text : "{CostCenter}"
    		});
        
        //	oViewModel.setProperty("/busy", true);
			oCostCenter.bindAggregation("items", { 
				"path" : path + "/PlantToCC",
				"template" : oItemSelectTemplate,
				"events" : {
						dataReceived: function () {
							oViewModel.setProperty("/busy", false);
							
					},
						dataRequested : function () {
							oViewModel.setProperty("/busy", true);
						}
					}
				
			});
		},
		onCostCenterChange: function(oEvent){
			var path = oEvent.oSource.getSelectedItem().getBindingContext().getPath();
			var oUnloadingPoint = this.getView().byId("unloadingpoint");
			var oViewModel = this.getModel("viewModel");
			
			var oItemSelectTemplate = new sap.ui.core.Item({
	            key : "{UnLoadingPointID}",
	            text : "{UnLoadingPoint}"
    		});
        
        //	oViewModel.setProperty("/busy", true);
			oUnloadingPoint.bindAggregation("items", { 
				"path" : path + "/CCUnloadingPoint",
				"template" : oItemSelectTemplate,
				"events" : {
						dataReceived: function () {
							oViewModel.setProperty("/busy", false);
					},
						dataRequested : function () {
							oViewModel.setProperty("/busy", true);
						}
					}
				
			});
=======
	"sap/ui/demo/masterdetail/controller/BaseController"
], function(BaseController) {
	"use strict";

	return BaseController.extend("sap.ui.demo.masterdetail.controller.homeView", {
		gotoForm: function(){
			this.getRouter().navTo("master", null, false);
		},
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf sap.ui.demo.masterdetail.view.homeView
		 */
		onInit: function() {
				this.getRouter().getRoute("home").attachPatternMatched(this._onMasterMatched, this);
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
		_onMasterMatched : function() {
		
>>>>>>> branch 'master' of https://github.com/halomoan/MarketList.git
		}
	});

});
=======
	"sap/ui/demo/masterdetail/controller/BaseController"
], function(BaseController) {
	"use strict";

	return BaseController.extend("sap.ui.demo.masterdetail.controller.homeView", {
		gotoForm: function(){
			this.getRouter().navTo("master", null, false);
		},
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf sap.ui.demo.masterdetail.view.homeView
		 */
		onInit: function() {
				this.getRouter().getRoute("home").attachPatternMatched(this._onMasterMatched, this);
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
		_onMasterMatched : function() {
		
		}
	});

});
>>>>>>> branch 'master' of https://github.com/halomoan/MarketList.git
