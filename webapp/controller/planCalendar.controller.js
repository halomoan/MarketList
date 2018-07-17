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
					scheduleheader: [{
						Pic: "sap-icon://cart",
						Name: "Kitchen Unloading",
						Role: "unloading point",
						NavHeaderToItem: [
							{
								StartDate: new Date("2018", "6", "16", "00", "01"),
								EndDate: new Date("2018", "6", "16", "23", "59"),
								Title: "PRID: 1234567890",
								info: "PO created",
								Type: "Type01",
								Pic: "sap-icon://add-product",
								Tentative: false
							},
							{
								StartDate: new Date("2018", "6", "17", "00", "01"),
								EndDate: new Date("2018", "6", "17", "23", "59"),
								Title: "PRID: 1234567890",
								Type: "Type02",
								Pic: "sap-icon://add-product",
								Tentative: false
							},
							{
								StartDate: new Date("2018", "6", "18", "00", "01"),
								EndDate: new Date("2018", "6", "18", "23", "59"),
								Title: "PRID: 1234567890",
								info: "PO created",
								Type: "Type03",
								Pic: "sap-icon://add-product",
								Tentative: true
							},
							{
								StartDate: new Date("2018", "6", "19", "00", "01"),
								EndDate: new Date("2018", "6", "19", "23", "59"),
								Title: "PRID: 1234567890",
								info: "PO created",
								Type: "Type02",
								Pic: "sap-icon://add-product",
								Tentative: false
							},
							{
								StartDate: new Date("2018", "6", "20", "00", "01"),
								EndDate: new Date("2018", "6", "20", "23", "59"),
								Title: "PRID: 1234567890",
								info: "room 1",
								Type: "Type01",
								Pic: "sap-icon://add-product",
								Tentative: false
							}
						]
					},
					{
							Pic: "sap-icon://cart",
							Name: "<NO UNLOADINGPOINT>",
							Role: "team member",
							NavHeaderToItem: [
								{
								StartDate: new Date("2018", "6", "18", "00", "01"),
								EndDate: new Date("2018", "6", "18", "23", "59"),
								Title: "PRID: 1234567890",
								info: "PO created",
								Type: "Type03",
								Pic: "sap-icon://add-product",
								Tentative: true
							},
							{
								StartDate: new Date("2018", "6", "19", "00", "01"),
								EndDate: new Date("2018", "6", "19", "23", "59"),
								Title: "PRID: 1234567890",
								info: "PO created",
								Type: "Type02",
								Pic: "sap-icon://add-product",
								Tentative: false
							},
							{
								StartDate: new Date("2018", "6", "20", "00", "01"),
								EndDate: new Date("2018", "6", "20", "23", "59"),
								Title: "PRID: 1234567890",
								info: "room 1",
								Type: "Type01",
								Pic: "sap-icon://add-product",
								Tentative: false
							}
							]
						}
					/*	,{
							Pic: "images/PPHGLogo.png",
							Name: "<NO UNLOADINGPOINT>",
							Role: "team member",
							appointments: [
								{
								StartDate: new Date("2018", "6", "18", "00", "01"),
								EndDate: new Date("2018", "6", "18", "23", "59"),
								Title: "PRID: 1234567890",
								info: "PO created",
								Type: "Type03",
								Pic: "sap-icon://add-product",
								Tentative: true
							},
							{
								StartDate: new Date("2018", "6", "19", "00", "01"),
								EndDate: new Date("2018", "6", "19", "23", "59"),
								Title: "PRID: 1234567890",
								info: "PO created",
								Type: "Type02",
								Pic: "sap-icon://add-product",
								Tentative: false
							},
							{
								StartDate: new Date("2018", "6", "20", "00", "01"),
								EndDate: new Date("2018", "6", "20", "23", "59"),
								Title: "PRID: 1234567890",
								info: "room 1",
								Type: "Type01",
								Pic: "sap-icon://add-product",
								Tentative: false
							}
							]
						},
						{
							Pic: "images/PPHGLogo.png",
							Name: "<NO UNLOADINGPOINT>",
							Role: "team member",
							appointments: [
								{
								StartDate: new Date("2018", "6", "18", "00", "01"),
								EndDate: new Date("2018", "6", "18", "23", "59"),
								Title: "PRID: 1234567890",
								info: "PO created",
								Type: "Type03",
								Pic: "sap-icon://add-product",
								Tentative: true
							},
							{
								StartDate: new Date("2018", "6", "19", "00", "01"),
								EndDate: new Date("2018", "6", "19", "23", "59"),
								Title: "PRID: 1234567890",
								info: "PO created",
								Type: "Type02",
								Pic: "sap-icon://add-product",
								Tentative: false
							},
							{
								StartDate: new Date("2018", "6", "20", "00", "01"),
								EndDate: new Date("2018", "6", "20", "23", "59"),
								Title: "PRID: 1234567890",
								info: "room 1",
								Type: "Type01",
								Pic: "sap-icon://add-product",
								Tentative: false
							}
							]
						},
						{
							Pic: "images/PPHGLogo.png",
							Name: "<NO UNLOADINGPOINT>",
							Role: "team member",
							appointments: [
								{
								StartDate: new Date("2018", "6", "18", "00", "01"),
								EndDate: new Date("2018", "6", "18", "23", "59"),
								Title: "PRID: 1234567890",
								info: "PO created",
								Type: "Type03",
								Pic: "sap-icon://add-product",
								Tentative: true
							},
							{
								StartDate: new Date("2018", "6", "19", "00", "01"),
								EndDate: new Date("2018", "6", "19", "23", "59"),
								Title: "PRID: 1234567890",
								info: "PO created",
								Type: "Type02",
								Pic: "sap-icon://add-product",
								Tentative: false
							},
							{
								StartDate: new Date("2018", "6", "20", "00", "01"),
								EndDate: new Date("2018", "6", "20", "23", "59"),
								Title: "PRID: 1234567890",
								info: "room 1",
								Type: "Type01",
								Pic: "sap-icon://add-product",
								Tentative: false
							}
							]
						}*/
					]
				});
				
				console.log(JSON.stringify(oModel.getData()));
				this.getView().setModel(oModel,"calModel");
				
				var oViewData = {
					calbusy : false,
					calbusyindicator: 0
				};
				var oViewModel = new JSONModel(oViewData);
				this.setModel(oViewModel, "detailView");
				
				this.getRouter().getRoute("plancalendar").attachPatternMatched(this._onMasterMatched, this);
			},
			_onMasterMatched: function(oEvent){
				var plantID = oEvent.getParameter("arguments").plantId;
				var CostCenterID = oEvent.getParameter("arguments").ccId;
				var sDate = oEvent.getParameter("arguments").date;
				this.refreshSchedule(plantID, CostCenterID, sDate);
				
				
			},
			refreshSchedule: function(plantID,CostCenterID,sDate) {
				var oModelSchedule = this.getOwnerComponent().getModel();
				var oViewModel = this.getModel("detailView");
				var oThis = this;
				
				var oFilters = [];
				oFilters.push( new sap.ui.model.Filter("Date", sap.ui.model.FilterOperator.EQ, sDate));
				oFilters.push( new sap.ui.model.Filter("PlantID", sap.ui.model.FilterOperator.EQ, plantID) );
				oFilters.push( new sap.ui.model.Filter("CostCenterID", sap.ui.model.FilterOperator.EQ, CostCenterID) );
				
				
				oViewModel.setProperty("/calbusy",true);
				oModelSchedule.read("/ScheduleSet", {
					urlParameters: {
					    "$expand": "NavScheduleToHeader/NavHeaderToItem"
					},
					filters: oFilters,
					success: function(rData) {
						var oSchedule = rData.results[0]; 
						var oJsonData = {};
						oJsonData.startDate = new Date();
						oJsonData.scheduleheader = oSchedule.NavScheduleToHeader.results;
						for (var idx in oJsonData.scheduleheader){
							 oJsonData.scheduleheader[idx].NavHeaderToItem = oJsonData.scheduleheader[idx].NavHeaderToItem.results;
						}
						console.log(JSON.stringify(oJsonData));
						
					oThis.getView().setModel(oJsonData,"calModel");
						oViewModel.setProperty("/calbusy",false);
					},
					error: function(oError){
						//sap.ui.core.BusyIndicator.hide();
						oViewModel.setProperty("/calbusy",false);
					}
				});		
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
			},
			onStartDateChange: function(oEvent){
				var oStartDate = oEvent.getSource().getStartDate();
				
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