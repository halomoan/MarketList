sap.ui.define([
	"sap/ui/demo/masterdetail/controller/BaseController",
	"sap/ui/model/json/JSONModel"
], function(BaseController,JSONModel) {
	"use strict";

	return BaseController.extend("sap.ui.demo.masterdetail.controller.planCalendar", {

		
			onInit: function() {
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "YYYY-MM-dd"
				});
				var oViewData = {
					calbusy : false,
					calbusyindicator: 0,
					listbusy: false,
					listbusyindicator: 0,
					Date: dateFormat.format(new Date((new Date()).getTime() + (24 * 60 * 60 * 1000)))
				};
				var oViewModel = new JSONModel(oViewData);
				this.setModel(oViewModel, "detailView");
				
				this.getRouter().getRoute("plancalendar").attachPatternMatched(this._onMasterMatched, this);
			},
			_onMasterMatched: function(oEvent){
				
				this.plantID = oEvent.getParameter("arguments").plantId;
				this.CostCenterID = oEvent.getParameter("arguments").ccId;
				this.oDate = new Date(oEvent.getParameter("arguments").date);
				
				var oViewModel = this.getModel("detailView");
				var oLocalData = this.getLocalData();
				oViewModel.setProperty("/Plant",oLocalData.Plant);
				oViewModel.setProperty("/CostCenter",oLocalData.CostCenter);
				
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
				
				if(oAppointment.getType() === "Type06" && oButton.getText() === this.getResourceBundle().getText("showDetail")) {
					this._handlePRChange(oAppointment);
				} 
				
				if (oButton.getText() === this.getResourceBundle().getText("hideDetail")){
				
					if (oAppointment) {
						//var sSelected = oAppointment.getSelected() ? "selected" : "deselected";
						var sPRID = oAppointment.getTitle();
						sPRID = sPRID.replace( /^\D+/g, ""); 
						
						var oLocalData = this.getLocalData();
						oLocalData.mode = "Change";
						oLocalData.Change = {};
						
						oLocalData.Change.PRID = sPRID;
						oLocalData.Change.DeliveryDate = this.getStringDate(oAppointment.getStartDate());
						oLocalData.Change.UnloadingPoint = oAppointment.getParent().getTitle();
						this.putLocalData(oLocalData);
						
						
						
						
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
			_handlePRChange: function(oAppointment){
				if (!this._oViewChangePR) {
					this._oViewChangePR = sap.ui.xmlfragment("changePR", "sap.ui.demo.masterdetail.view.calRChangePR", this);
					this.getView().addDependent(this._oViewChangePR);
				}
				this._oViewChangePR.openBy(oAppointment);
				var oFrag =  sap.ui.core.Fragment;
				var oDP = oFrag.byId("changePR", "prDate");
				oDP.setValue(this.getStringDate(oAppointment.getStartDate()));
				var oUP = oFrag.byId("changePR", "selectUPoint");
				oUP.setSelectedKey(oAppointment.getParent().getTitle());
				
				var oLocalData = this.getLocalData();
				oLocalData.mode = "Change";
				oLocalData.Change = {};
				oLocalData.Create = null;
				
				
				var sPRID = oAppointment.getTitle();
				oLocalData.SourcePage = "planCal";
				oLocalData.Change.PRID = sPRID.replace("PRID: ","");
				oLocalData.Change.UnloadingPoint = oAppointment.getParent().getTitle();
				oLocalData.Change.DeliveryDate = this.getStringDate(oAppointment.getStartDate());
				this.putLocalData(oLocalData);                         
			},
			handleIntervalSelect: function (oEvent) {
			
				var oRow = oEvent.getParameter("row");
				var oStartDate = oEvent.getParameter("startDate");
				
				var oLocalData = this.getLocalData();
				
				if (oRow) {
				
					oLocalData.UnloadingPointID = oRow.getTitle();
					oLocalData.UnloadingPoint = oRow.getTitle();
				} else {
					var oPC = oEvent.oSource;
					var aSelectedRows = oPC.getSelectedRows();
					for (var i = 0; i < aSelectedRows.length; i++) {
					
						oLocalData.UnloadingPointID = aSelectedRows[i];
						oLocalData.UnloadingPoint = aSelectedRows[i];
					}
				}
				
				oLocalData.Date = this.getStringDate(oStartDate);                             
			
				this.putLocalData(oLocalData);          
			},
			onAddPR: function(){
				if (!this._oViewCreatePR) {
					this._oViewCreatePR = sap.ui.xmlfragment("addPR","sap.ui.demo.masterdetail.view.calCreatePR", this);
					this.getView().addDependent(this._oViewCreatePR);
					this._oViewCreatePR.addStyleClass(this.getOwnerComponent().getContentDensityClass());
				}
			
					var oLocalData = this.getLocalData();
					
					var oFrag =  sap.ui.core.Fragment;
					var oSelect = oFrag.byId("addPR", "selectUPoint");
					var oItems = oSelect.getItems();
					
					if(oItems.length === 0) {
						var item = new sap.ui.core.Item({
							key : oLocalData.UnloadingPointID,
							text : oLocalData.UnloadingPoint
						});
						oSelect.addItem(item);
					}
					oSelect.setSelectedKey(oLocalData.UnloadingPointID);
					
					var oDP = oFrag.byId("addPR","startDate");
			
					oDP.setValue(oLocalData.Date);  
				
				this._oViewCreatePR.open();
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
			onCreatePR: function(){
				var oFrag =  sap.ui.core.Fragment;
				
				if (oFrag.byId("addPR", "startDate").getValueState() !== sap.ui.core.ValueState.Error){
					
						this._oViewCreatePR.close();
						
					
						var oStartDate = oFrag.byId("addPR", "startDate").getDateValue();
					    var oSelect = oFrag.byId("addPR", "selectUPoint");
						var oLocalData = this.getLocalData();
						oLocalData.SourcePage = "planCal";
						oLocalData.mode = "Create";
						oLocalData.Change = null;
						oLocalData.Create = {};
						oLocalData.Create.Single = true;
						oLocalData.Create.DeliveryDate = this.getStringDate(oStartDate);
						if (oSelect.getSelectedItem()) {
							oLocalData.Create.UnloadingPoint = oSelect.getSelectedItem().getKey();
						} else {
							oLocalData.Create.UnloadingPoint = oLocalData.UnloadingPoint;                         
						}
						this.putLocalData(oLocalData); 
						
						this.getRouter().navTo("dsmaster", null, false);
				}
				
			},
			onChangePR: function(){
				
				var oLocalData = this.getLocalData();
				
				
				if (oLocalData.Change.PRID) {
					var PRID = oLocalData.Change.PRID;
					var plantID = oLocalData.PlantID;
					var oThis = this;
					var bChanged = false;
					
					var oFrag =  sap.ui.core.Fragment;
					var oDP = oFrag.byId("changePR", "prDate");
					var newDate = oDP.getValue();
					var oUP = oFrag.byId("changePR", "selectUPoint");
					var newUP = oUP.getSelectedItem().getKey();
					
					var msg = this.getResourceBundle().getText("msgConfirmChangePR",[PRID]);
					
					if (oDP.getValueState() === sap.ui.core.ValueState.Error) {
						sap.m.MessageToast.show(this.getResourceBundle().getText("msgWrongDateFuture"));
						return;
					}
					if (oLocalData.Change.DeliveryDate !== newDate ) {
						msg = msg + "\n\r\n\r" + this.getResourceBundle().getText("msgDateFromTo",[oLocalData.Change.DeliveryDate,newDate]);
						bChanged = true;
					}
					
					if (oLocalData.Change.UnloadingPoint !== newUP ) {
						msg = msg + "\n\r\n\r" + this.getResourceBundle().getText("msgUPFromTo",[oLocalData.Change.UnloadingPoint,newUP]);
						bChanged = true;
					}
					
					if (bChanged){
						
						var dialog = new sap.m.Dialog({
							title: this.getResourceBundle().getText("confirm"),
							type: "Message",
							content: new sap.m.Text({ text: msg }),
							beginButton: new sap.m.Button({
								text: this.getResourceBundle().getText("submit"),
								press: function () {
									
									
									
									var oModel = oThis.getView().getModel();
									oModel.callFunction("/ChangePR", {
								               method: "POST",
								               urlParameters:  {"PlantID" : plantID, "PRID" : PRID, "DeliveryDate" : newDate.replace(/-/g, ""), "UnloadingPoint" : newUP }, 
												success: function(oData, oResponse) {
													sap.m.MessageBox.success(oData.Message, {
											            title: "Response",                                      
											            initialFocus: null
											        });
											        oThis.refreshSchedule();
												},
												error: function(error) {
												},
												async: false
												
								    });
									dialog.close();
								}
							}),
							endButton: new sap.m.Button({
								text: this.getResourceBundle().getText("cancel"),
								press: function () {
									dialog.close();
								}
							}),
							afterClose: function() {
								dialog.destroy();
							}
						});
			
						dialog.open();
					} else {
						//Nothing Changed
						sap.m.MessageBox.information(this.getResourceBundle().getText("msgNoChanged"), {
										            title: this.getResourceBundle().getText("warning"),                                      
										            initialFocus: null
										        });
					}
					this._oViewChangePR.close();
				}
				
				
			},
			onChangePRDetail : function(){
				this._oViewChangePR.close();
				
				var oLocalData = this.getLocalData();
				
				if (oLocalData.mode === "Change") {
					this.getRouter().navTo("dsmaster", null, false);	
				}

			},
			onCloseCreate: function(){
				this._oViewCreatePR.close();
			},
			onCloseChange: function(){
				if (this._oViewChangePR) {
					this._oViewChangePR.close();	
				}
				
				if (this._oViewDChangePR) {
					this._oViewDChangePR.close();
				}
			},
			onChangeProduct: function(){
				var oLocalData = this.getLocalData();
				
				if (!this._oViewDChangePR) {
					this._oViewDChangePR = sap.ui.xmlfragment("DchangePR", "sap.ui.demo.masterdetail.view.calDChangePR", this);
					this.getView().addDependent(this._oViewDChangePR);
				}
				this._oViewDChangePR.open();
				var oFrag =  sap.ui.core.Fragment;
				var oDP = oFrag.byId("DchangePR", "prDate");
				oDP.setValue(oLocalData.View.Date);
				var oUP = oFrag.byId("DchangePR", "selectUPoint");
				oUP.setSelectedKey(oLocalData.View.UnloadingPoint);
			}

	});

});