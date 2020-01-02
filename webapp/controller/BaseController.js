/*global history */
sap.ui.define([
		"sap/ui/core/mvc/Controller",
		"sap/ui/core/routing/History"
	], function (Controller, History) {
		"use strict";

		return Controller.extend("sap.ui.demo.masterdetail.controller.BaseController", {
			/**
			 * Convenience method for accessing the router in every controller of the application.
			 * @public
			 * @returns {sap.ui.core.routing.Router} the router for this component
			 */
			getRouter : function () {
				return this.getOwnerComponent().getRouter();
			},

			/**
			 * Convenience method for getting the view model by name in every controller of the application.
			 * @public
			 * @param {string} sName the model name
			 * @returns {sap.ui.model.Model} the model instance
			 */
			getModel : function (sName) {
				return this.getView().getModel(sName);
			},

			/**
			 * Convenience method for setting the view model in every controller of the application.
			 * @public
			 * @param {sap.ui.model.Model} oModel the model instance
			 * @param {string} sName the model name
			 * @returns {sap.ui.mvc.View} the view instance
			 */
			setModel : function (oModel, sName) {
				return this.getView().setModel(oModel, sName);
			},

			/**
			 * Convenience method for getting the resource bundle.
			 * @public
			 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
			 */
			getResourceBundle : function () {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle();
			},
			
			setDeviceModel: function(){
				var deviceModel = new sap.ui.model.json.JSONModel({
				            isTouch : sap.ui.Device.support.touch,
				            isNoTouch : !sap.ui.Device.support.touch,
				            isPhone : sap.ui.Device.system.phone,
				            isNoPhone : !sap.ui.Device.system.phone,
				            isTablet : sap.ui.Device.system.tablet,
				            listMode : sap.ui.Device.system.phone ? "SingleSelectMaster" : "SingleSelectMaster",
				            listItemType : sap.ui.Device.system.phone ? "Active" : "Inactive",
				            splitMode : sap.ui.Device.system.phone ? "HideMode" : "HideMode"
				        });
				deviceModel.setDefaultBindingMode("OneWay");
				this.getView().setModel(deviceModel, "device");
			},

			onNavBack : function() {
				var sPreviousHash = History.getInstance().getPreviousHash();

					if (sPreviousHash !== undefined) {
					history.go(-1);
				} else {
					this.getRouter().navTo("home", {}, true);
				}
			},
			onNavHome : function(){
				this.getRouter().navTo("home", {}, true);
			},
			getStringDate : function(oDate){
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "yyyy-MM-dd"
				});
				return dateFormat.format(oDate); 
			},
			getSAPDate: function(oDate){
					var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "yyyyMMdd"
				});
				return dateFormat.format(oDate); 
			},
			getLocalData: function(){
				var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
				return oStorage.get("localStorage");
				
			},
			putLocalData: function(oData){
				var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
				 oStorage.put("localStorage",oData);
			},
			clearLocalData: function(){
				if (jQuery.sap.storage.isSupported()) {
					jQuery.sap.storage.clear();
				}
			}
			

		});

	}
);