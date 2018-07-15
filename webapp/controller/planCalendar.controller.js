sap.ui.define([
	"sap/ui/demo/masterdetail/controller/BaseController",
	"sap/ui/model/json/JSONModel"
], function(BaseController,JSONModel) {
	"use strict";

	return BaseController.extend("sap.ui.demo.masterdetail.controller.planCalendar", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf sap.ui.demo.masterdetail.view.planCalendar
		 */
			onInit: function() {
			var oModel = new JSONModel();
				oModel.setData({
					startDate: new Date("2018", "6", "15", "8", "0"),
					people: [{
						pic: "images/UOL150x60.png",
						name: "Kitchen Unloading",
						role: "unloading point",
						appointments: [
							{
								start: new Date("2018", "6", "16", "00", "01"),
								end: new Date("2018", "6", "16", "23", "59"),
								title: "PRID: 1234567890",
								info: "PO created",
								type: "Type01",
								pic: "sap-icon://add-product",
								tentative: false
							},
							{
								start: new Date("2018", "6", "17", "00", "01"),
								end: new Date("2018", "6", "17", "23", "59"),
								title: "PRID: 1234567890",
								type: "Type02",
								pic: "sap-icon://add-product",
								tentative: false
							},
							{
								start: new Date("2018", "6", "18", "00", "01"),
								end: new Date("2018", "6", "18", "23", "59"),
								title: "PRID: 1234567890",
								info: "PO created",
								type: "Type03",
								pic: "sap-icon://add-product",
								tentative: true
							},
							{
								start: new Date("2018", "6", "19", "00", "01"),
								end: new Date("2018", "6", "19", "23", "59"),
								title: "PRID: 1234567890",
								info: "PO created",
								type: "Type02",
								pic: "sap-icon://add-product",
								tentative: false
							},
							{
								start: new Date("2018", "6", "20", "00", "01"),
								end: new Date("2018", "6", "20", "23", "59"),
								title: "PRID: 1234567890",
								info: "room 1",
								type: "Type01",
								pic: "sap-icon://add-product",
								tentative: false
							}
						]
					},
					{
							pic: "images/PPHGLogo.png",
							name: "<NO UNLOADINGPOINT>",
							role: "team member",
							appointments: [
								{
								start: new Date("2018", "6", "18", "00", "01"),
								end: new Date("2018", "6", "18", "23", "59"),
								title: "PRID: 1234567890",
								info: "PO created",
								type: "Type03",
								pic: "sap-icon://add-product",
								tentative: true
							},
							{
								start: new Date("2018", "6", "19", "00", "01"),
								end: new Date("2018", "6", "19", "23", "59"),
								title: "PRID: 1234567890",
								info: "PO created",
								type: "Type02",
								pic: "sap-icon://add-product",
								tentative: false
							},
							{
								start: new Date("2018", "6", "20", "00", "01"),
								end: new Date("2018", "6", "20", "23", "59"),
								title: "PRID: 1234567890",
								info: "room 1",
								type: "Type01",
								pic: "sap-icon://add-product",
								tentative: false
							}
							]
						},
						{
							pic: "images/PPHGLogo.png",
							name: "<NO UNLOADINGPOINT>",
							role: "team member",
							appointments: [
								{
								start: new Date("2018", "6", "18", "00", "01"),
								end: new Date("2018", "6", "18", "23", "59"),
								title: "PRID: 1234567890",
								info: "PO created",
								type: "Type03",
								pic: "sap-icon://add-product",
								tentative: true
							},
							{
								start: new Date("2018", "6", "19", "00", "01"),
								end: new Date("2018", "6", "19", "23", "59"),
								title: "PRID: 1234567890",
								info: "PO created",
								type: "Type02",
								pic: "sap-icon://add-product",
								tentative: false
							},
							{
								start: new Date("2018", "6", "20", "00", "01"),
								end: new Date("2018", "6", "20", "23", "59"),
								title: "PRID: 1234567890",
								info: "room 1",
								type: "Type01",
								pic: "sap-icon://add-product",
								tentative: false
							}
							]
						},
						{
							pic: "images/PPHGLogo.png",
							name: "<NO UNLOADINGPOINT>",
							role: "team member",
							appointments: [
								{
								start: new Date("2018", "6", "18", "00", "01"),
								end: new Date("2018", "6", "18", "23", "59"),
								title: "PRID: 1234567890",
								info: "PO created",
								type: "Type03",
								pic: "sap-icon://add-product",
								tentative: true
							},
							{
								start: new Date("2018", "6", "19", "00", "01"),
								end: new Date("2018", "6", "19", "23", "59"),
								title: "PRID: 1234567890",
								info: "PO created",
								type: "Type02",
								pic: "sap-icon://add-product",
								tentative: false
							},
							{
								start: new Date("2018", "6", "20", "00", "01"),
								end: new Date("2018", "6", "20", "23", "59"),
								title: "PRID: 1234567890",
								info: "room 1",
								type: "Type01",
								pic: "sap-icon://add-product",
								tentative: false
							}
							]
						},
						{
							pic: "images/PPHGLogo.png",
							name: "<NO UNLOADINGPOINT>",
							role: "team member",
							appointments: [
								{
								start: new Date("2018", "6", "18", "00", "01"),
								end: new Date("2018", "6", "18", "23", "59"),
								title: "PRID: 1234567890",
								info: "PO created",
								type: "Type03",
								pic: "sap-icon://add-product",
								tentative: true
							},
							{
								start: new Date("2018", "6", "19", "00", "01"),
								end: new Date("2018", "6", "19", "23", "59"),
								title: "PRID: 1234567890",
								info: "PO created",
								type: "Type02",
								pic: "sap-icon://add-product",
								tentative: false
							},
							{
								start: new Date("2018", "6", "20", "00", "01"),
								end: new Date("2018", "6", "20", "23", "59"),
								title: "PRID: 1234567890",
								info: "room 1",
								type: "Type01",
								pic: "sap-icon://add-product",
								tentative: false
							}
							]
						}
					]
				});
				this.getView().setModel(oModel);
			},
			onShowDetail: function(oEvent){
				var oButton = oEvent.getSource();
				var oTopLayout = this.byId("topLayout");
				var oBottomLayout = this.byId("bottomLayout");
				
				if (oButton.getText() === this.getResourceBundle().getText("hideDetail")){
				
					oTopLayout.setSize("100%");
					oBottomLayout.setSize("0%");
					oButton.setText(this.getResourceBundle().getText("showDetail"));
					
				}else{
					oTopLayout.setSize("50%");
					oBottomLayout.setSize("50%");
					oButton.setText(this.getResourceBundle().getText("hideDetail"));
				}
			}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf sap.ui.demo.masterdetail.view.planCalendar
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf sap.ui.demo.masterdetail.view.planCalendar
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf sap.ui.demo.masterdetail.view.planCalendar
		 */
		//	onExit: function() {
		//
		//	}

	});

});