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
				var oViewData = {
					calbusy : false,
					calbusyindicator: 0,
					listbusy: false,
					listbusyindicator: 0
				};
				var oViewModel = new JSONModel(oViewData);
				this.setModel(oViewModel, "detailView");
				
				var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
				var oLocal = oStorage.get("localStorage");
				
				oViewModel.setProperty("/Plant",oLocal.Plant);
				oViewModel.setProperty("/CostCenter",oLocal.CostCenter);
				
				this.getRouter().getRoute("plancalendar").attachPatternMatched(this._onMasterMatched, this);
			},
			_onMasterMatched: function(oEvent){
				
				this.plantID = oEvent.getParameter("arguments").plantId;
				this.CostCenterID = oEvent.getParameter("arguments").ccId;
				this.oDate = new Date(oEvent.getParameter("arguments").date);
				this.refreshSchedule();
				
				
			},
			refreshSchedule: function() {
				var oModelSchedule = this.getOwnerComponent().getModel();
				var oViewModel = this.getModel("detailView");
				var oThis = this;
				
				var oFilters = [];
				oFilters.push( new sap.ui.model.Filter("Date", sap.ui.model.FilterOperator.EQ, this.oDate.getTime()));
				oFilters.push( new sap.ui.model.Filter("PlantID", sap.ui.model.FilterOperator.EQ, this.plantID) );
				oFilters.push( new sap.ui.model.Filter("CostCenterID", sap.ui.model.FilterOperator.EQ, this.CostCenterID) );
				
				oViewModel.setProperty("/calbusy",true);
				oModelSchedule.read("/ScheduleSet", {
					urlParameters: {
					    "$expand": "NavScheduleToHeader/NavHeaderToItem"
					},
					filters: oFilters,
					success: function(rData) {
						var oSchedule = rData.results[0]; 
						var oJsonData = {};
						oJsonData.scheduleheader = oSchedule.NavScheduleToHeader.results;
						for (var idx in oJsonData.scheduleheader){
							 oJsonData.scheduleheader[idx].NavHeaderToItem = oJsonData.scheduleheader[idx].NavHeaderToItem.results;
						}
						var oJson = new JSONModel();
						oJson.setData(oJsonData);
						oJson.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
						
						oThis.getView().setModel(oJson,"calModel");
						oViewModel.setProperty("/calbusy",false);
					},
					error: function(oError){
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
					oTopLayout.setSize("auto");
					oBottomLayout.setSize("auto");
					oButton.setText(this.getResourceBundle().getText("hideDetail"));
				}
			},
			onStartDateChange: function(oEvent){
				var oStartDate = oEvent.getSource().getStartDate();
				if (oStartDate.getFullYear() !== this.oDate.getFullYear()){
					this.oDate = oStartDate;
					this.refreshSchedule();
				}
				
			},
			onAppointmentSelect: function (oEvent) {
				var oAppointment = oEvent.getParameter("appointment");
				var oThis = this;
				var oButton =  this.byId("showDetail");
				var oViewModel = this.getModel("detailView");
				
				if (oButton.getText() === this.getResourceBundle().getText("hideDetail")){
				
					if (oAppointment) {
						//var sSelected = oAppointment.getSelected() ? "selected" : "deselected";
						var sPRID = oAppointment.getTitle();
						sPRID = sPRID.replace( /^\D+/g, ""); 
						
						var sObjectPath = this.getModel().createKey("/MarketListHeaderSet", {
							MarketListHeaderID :  sPRID
						});
						
					
						var oModel = this.getModel();
						oViewModel.setProperty("/listbusy",true);
						oModel.read(sObjectPath, {
							urlParameters: {
						      "$expand": "NavDetail"
							},
							success: function(rData) {
								//console.log(rData.NavDetail);
								var oJson = new JSONModel();
								oJson.setData(rData.NavDetail);
								oJson.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
								oThis.setModel(oJson,"mktitem");
								oViewModel.setProperty("/listbusy",false);
							},
							error: function(oError) {
								oViewModel.setProperty("/listbusy",false);
							}
						});
					
						/*
						//console.log("'" + sPRID + "' " + sSelected + ". \n Selected appointments: " + this.byId("PC1").getSelectedAppointments().length);
						} else {
						var aAppointments = oEvent.getParameter("appointments");
						var sValue = aAppointments.length + " Appointments selected";
						console.log(sValue);*/
					}
				}
			},
			handleIntervalSelect: function (oEvent) {
				var oPC = oEvent.oSource;
				var oStartDate = oEvent.getParameter("startDate");
				var oEndDate = oEvent.getParameter("endDate");
				var oRow = oEvent.getParameter("row");
				var oModel = this.getView().getModel("calModel");
				var oData = oModel.getData();
				var iIndex = -1;
				var oAppointment = {
					StartDate: oStartDate,
					EndDate: oEndDate,
					Title: "new appointment",
					Type: "Type09",
					Tentative: true
				};

			
				if (oRow) {
					iIndex = oPC.indexOfRow(oRow);
					oData.scheduleheader[iIndex].NavHeaderToItem.push(oAppointment);
				} else {
					var aSelectedRows = oPC.getSelectedRows();
					for (var i = 0; i < aSelectedRows.length; i++) {
						iIndex = oPC.indexOfRow(aSelectedRows[i]);
						oData.scheduleheader[iIndex].NavHeaderToItem.push(oAppointment);
					}
				}

				oModel.setData(oData);

			},
			onAppointmentAddWithContext: function(oEvent){
				var oFrag =  sap.ui.core.Fragment,
					currentRow,
					sUnloadingPoint,
					oSelect,
					oSelectedItem,
					oSelectedIntervalStart,
					oStartDate,
					oSelectedIntervalEnd,
					oEndDate,
					oDateTimePickerStart,
					oDateTimePickerEnd,
					oBeginButton;

				this._createDialog();

				currentRow = oEvent.getParameter("row");
				sUnloadingPoint = currentRow.getTitle();
				oSelect = this.oNewAppointmentDialog.getContent()[0].getContent()[1];
				oSelectedItem = oSelect.getItems().filter(function(oItem) { return oItem.getText() === sUnloadingPoint; })[0];
				oSelect.setSelectedItem(oSelectedItem);

				oSelectedIntervalStart = oEvent.getParameter("startDate");
				oStartDate = oFrag.byId("myFrag", "startDate");
				oStartDate.setDateValue(oSelectedIntervalStart);

				oSelectedIntervalEnd = oEvent.getParameter("endDate");
				oEndDate = oFrag.byId("myFrag", "endDate");
				oEndDate.setDateValue(oSelectedIntervalEnd);

				oDateTimePickerStart = oFrag.byId("myFrag", "startDate");
				oDateTimePickerEnd =  oFrag.byId("myFrag", "endDate");
				oBeginButton = this.oNewAppointmentDialog.getBeginButton();

				oDateTimePickerStart.setValueState("None");
				oDateTimePickerEnd.setValueState("None");

				this.updateButtonEnabledState(oDateTimePickerStart, oDateTimePickerEnd, oBeginButton);
				this.oNewAppointmentDialog.open();
			}

	});

});