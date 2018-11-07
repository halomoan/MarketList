sap.ui.define([
	"sap/ui/demo/masterdetail/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/demo/masterdetail/model/formatter"
], function(BaseController,JSONModel,formatter) {
	"use strict";

	return BaseController.extend("sap.ui.demo.masterdetail.controller.planCalendar", {

			
			onInit: function() {
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "YYYY-MM-dd"
				});
				var oViewData = {
					calbusy : false,
					calbusyindicator: 0,
					showChange : false,
					listbusy: false,
					POCreated: true,
					PurReqID: "",
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
				
				this.oLocalData = this.getLocalData();
				this.oLocalData.SourcePage = "planCal";
				this.oLocalData.Change = {};
				this.oLocalData.Change.PRID = null;
				this.putLocalData(this.oLocalData);
				
				oViewModel.setProperty("/Plant",this.oLocalData.Plant);
				oViewModel.setProperty("/CostCenter",this.oLocalData.CostCenter);
				oViewModel.setProperty("/POCreated",true);
				oViewModel.setProperty("/PurReqID","");
				
				var oJson = new JSONModel();
				this.setModel(oJson,"mktitem");
				
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
				
				if (oStartDate.getMonth() !== this.oDate.getMonth()){
					this.oDate = oStartDate;
					this.refreshSchedule();
				}
				/*if (oStartDate.getFullYear() !== this.oDate.getFullYear()){
					this.oDate = oStartDate;
					this.refreshSchedule();
				}*/
				
			},
			onAppointmentSelect: function (oEvent) {
				var oAppointment = oEvent.getParameter("appointment");
				var oThis = this;
				var oButton =  this.byId("showDetail");
				var oViewModel = this.getModel("detailView");
				var sPRID = oAppointment.getTitle();
				//var sStatus = oAppointment.getText();
				sPRID = sPRID.replace( /^\D+/g, ""); 
				oViewModel.setProperty("/PurReqID",sPRID);
				oViewModel.setProperty("/POCreated",true);
				
				
				if(oAppointment.getType() === "Type06" && oButton.getText() === this.getResourceBundle().getText("showDetail")) {
					this._handlePRChange(oAppointment);
				} 
				
				if (oButton.getText() === this.getResourceBundle().getText("hideDetail")){
				
					if (oAppointment) {
						//var sSelected = oAppointment.getSelected() ? "selected" : "deselected";
						if(oAppointment.getType() === "Type06"){
							oViewModel.setProperty("/showChange",true);
						} else{
							oViewModel.setProperty("/showChange",false);
						}
						
						var oSearchField = this.getView().byId("searchField");
						oSearchField.setValue("");
				
						this.oLocalData.mode = "Change";
						this.oLocalData.Change = {};
						
						this.oLocalData.Change.PRID = sPRID;
						this.oLocalData.Change.DeliveryDate = this.getStringDate(oAppointment.getStartDate());
						this.oLocalData.Change.UnloadingPoint = oAppointment.getParent().getTitle();
						this.putLocalData(this.oLocalData);
						
						
						
						
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
								oThis.oLocalData.Change.Recipient = rData.Recipient;
								oThis.oLocalData.Change.Requisitioner = rData.Requisitioner;
								oThis.putLocalData(oThis.oLocalData);
								
								if(!rData.TableH.LOCK0){
									oViewModel.setProperty("/POCreated",false);
								} 
								
								oViewModel.setProperty("/listbusy",false);
							},
							error: function(oError) {
								oViewModel.setProperty("/listbusy",false);
							}
						});
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
				
				oUP.destroyItems();					
				var oUPItems = JSON.parse(this.oLocalData.UPoints);
					
				for (var i in oUPItems) {
						var item = new sap.ui.core.Item({
							key : oUPItems[i],
							text :oUPItems[i]
						});
						oUP.addItem(item);
				}
					
				oUP.setSelectedKey(oAppointment.getParent().getTitle());
				
				
				this.oLocalData.mode = "Change";
				this.oLocalData.Change = {};
				this.oLocalData.Create = null;
				
				
				var sPRID = oAppointment.getTitle();
				//this.oLocalData.SourcePage = "planCal";
				this.oLocalData.Change.PRID = sPRID.replace("PRID: ","");
				this.oLocalData.Change.UnloadingPoint = oAppointment.getParent().getTitle();
				this.oLocalData.Change.DeliveryDate = this.getStringDate(oAppointment.getStartDate());
				this.putLocalData(this.oLocalData);                         
			},
			handleIntervalSelect: function (oEvent) {
			
				var oRow = oEvent.getParameter("row");
				var oStartDate = oEvent.getParameter("startDate");
				
				
				
				if (oRow) {
				
					this.oLocalData.UnloadingPointID = oRow.getTitle();
					this.oLocalData.UnloadingPoint = oRow.getTitle();
				} else {
					var oPC = oEvent.oSource;
					var aSelectedRows = oPC.getSelectedRows();
					for (var i = 0; i < aSelectedRows.length; i++) {
					
						this.oLocalData.UnloadingPointID = aSelectedRows[i];
						this.oLocalData.UnloadingPoint = aSelectedRows[i];
					}
				}
				
				this.oLocalData.Date = this.getStringDate(oStartDate);                             
			
				this.putLocalData(this.oLocalData);          
			},
			onAddPR: function(){
				if (!this._oViewCreatePR) {
					this._oViewCreatePR = sap.ui.xmlfragment("addPR","sap.ui.demo.masterdetail.view.calCreatePR", this);
					this.getView().addDependent(this._oViewCreatePR);
					this._oViewCreatePR.addStyleClass(this.getOwnerComponent().getContentDensityClass());
				}
					
					
					var oFrag =  sap.ui.core.Fragment;
					var oSelect = oFrag.byId("addPR", "selectUPoint");
					oSelect.destroyItems();
					var oUPItems = JSON.parse(this.oLocalData.UPoints);
					
					for (var i in oUPItems) {
						var item = new sap.ui.core.Item({
							key : oUPItems[i],
							text :oUPItems[i]
						});
						oSelect.addItem(item);
					}
					oSelect.setSelectedKey(this.oLocalData.UnloadingPointID);
					
					var oDP = oFrag.byId("addPR","startDate");
			
					oDP.setValue(this.oLocalData.Date);  
				
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
						
						
						//this.oLocalData.SourcePage = "planCal";
						this.oLocalData.mode = "Create";
						this.oLocalData.Change = null;
						this.oLocalData.Create = {};
						this.oLocalData.Create.Single = true;
						this.oLocalData.Create.DeliveryDate = this.getStringDate(oStartDate);
						if (oSelect.getSelectedItem()) {
							this.oLocalData.Create.UnloadingPoint = oSelect.getSelectedItem().getKey();
						} else {
							this.oLocalData.Create.UnloadingPoint = this.oLocalData.UnloadingPoint;                         
						}
						this.putLocalData(this.oLocalData); 
						
						if (!sap.ui.Device.system.phone) {
							this.getRouter().navTo("dsmaster", null, false);
						} else {	
							this.getRouter().navTo("mdsmaster", null, false);
						}
				}
				
			},
			onChangePR: function(){
				
				if (this.oLocalData.Change.PRID) {
					var PRID = this.oLocalData.Change.PRID;
					var plantID = this.oLocalData.PlantID;
					var oThis = this;
					var bChanged = false;
					
					var oFrag =  sap.ui.core.Fragment;
					var oDP = oFrag.byId("changePR", "prDate");
					if (!oDP) {
						oDP = oFrag.byId("DchangePR", "prDate");
					}
					var newDate = oDP.getValue();
					var oUP = oFrag.byId("changePR", "selectUPoint");
					if (!oUP){
						oUP = oFrag.byId("DchangePR", "selectUPoint");
					}
					
					var newUP = oUP.getSelectedItem().getKey();
					
					var msg = this.getResourceBundle().getText("msgConfirmChangePR",[PRID]);
					
					if (oDP.getValueState() === sap.ui.core.ValueState.Error) {
						sap.m.MessageToast.show(this.getResourceBundle().getText("msgWrongDateFuture"));
						return;
					}
					if (this.oLocalData.Change.DeliveryDate !== newDate ) {
						msg = msg + "\n\r\n\r" + this.getResourceBundle().getText("msgDateFromTo",[this.oLocalData.Change.DeliveryDate,newDate]);
						bChanged = true;
					}
					
					if (this.oLocalData.Change.UnloadingPoint !== newUP ) {
						msg = msg + "\n\r\n\r" + this.getResourceBundle().getText("msgUPFromTo",[this.oLocalData.Change.UnloadingPoint,newUP]);
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
					if(this._oViewChangePR) {
						this._oViewChangePR.close();
					}else if(this.oViewDChangePR) {
						this._oViewChangePR.close();
					}
				}
				
				
			},
			onChangePRDetail : function(){
				if(this._oViewChangePR) {
						this._oViewChangePR.close();
					}else if(this.oViewDChangePR) {
						this._oViewChangePR.close();
				}
				
			
				
				if (this.oLocalData.mode === "Change") {
					if (!sap.ui.Device.system.phone) {
						this.getRouter().navTo("dsmaster", null, false);	
					}else{
						this.getRouter().navTo("mdsmaster", null, false);	
					}
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
			
				if (!this._oViewDChangePR) {
					this._oViewDChangePR = sap.ui.xmlfragment("DchangePR", "sap.ui.demo.masterdetail.view.calDChangePR", this);
					this.getView().addDependent(this._oViewDChangePR);
				}
				this._oViewDChangePR.open();
				var oFrag =  sap.ui.core.Fragment;
				var oDP = oFrag.byId("DchangePR", "prDate");
				oDP.setValue(this.oLocalData.Change.DeliveryDate);
				var oUP = oFrag.byId("DchangePR", "selectUPoint");
				oUP.destroyItems();
					
				var oUPItems = JSON.parse(this.oLocalData.UPoints);
				
				for (var i in oUPItems) {
					var item = new sap.ui.core.Item({
						key : oUPItems[i],
						text :oUPItems[i]
					});
					oUP.addItem(item);
				}
				oUP.setSelectedKey(this.oLocalData.UnloadingPointID);
			},
			onSearch: function(oEvent){
				var oList = this.getView().byId("PRItemList");
				var sQuery = oEvent.getParameter("query");
				
				var filters = [];
				var binding = oList.getBinding("items");
				
				filters.push(new sap.ui.model.Filter({
				    filters: [
				    new sap.ui.model.Filter("MaterialID", sap.ui.model.FilterOperator.Contains, sQuery),
				    new sap.ui.model.Filter("MaterialText", sap.ui.model.FilterOperator.Contains, sQuery)
				    ],
				    and: false
				}));
				
				binding.filter(filters);
			},
			onCreatePO: function() {
				
				var PRID = this.oLocalData.Change.PRID;
				var plantID = this.oLocalData.PlantID;
				if (PRID) {
				
				var oThis = this;
				var msg = this.getResourceBundle().getText("msgConfirmCreatePO",[PRID]);
				var dialog = new sap.m.Dialog({
					title: "Generate PO",
					type: "Message",
					content: new sap.m.Text({ text: msg }),
					beginButton: new sap.m.Button({
						text: this.getResourceBundle().getText("submit"),
						press: function () {
							
							var oModel = oThis.getView().getModel();
							oModel.callFunction("/RunAutoPO", {
							    method: "POST",
							    urlParameters:  {"PlantID" : plantID, "PRID" : PRID  }, 
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
				}
			},
			onPrint: function(){
				var oData = this.getModel("mktitem").getData();
				
				if (oData.results) {
				var bhtml = "<html><head><title>Market List</title><link rel='stylesheet' type='text/css' href='css/style.css'></head><body>";
				bhtml += "<basefont face='arial, verdana, sans-serif' color='#ff0000'>";
				var ehtml = "</body></html>";
				var header = "<center><h3>Market List Report</h3></center><hr>";
					header = header + "<div align='right'><button id='printPageButton' onclick='window.print(); window.close();'>Print</button></div>";
					header = header + "<table width='100%' align='left'><thead><tr>";	
					header = header +"<th align='left'>Purchase Requisition #: " + this.oLocalData.Change.PRID + "</th>";
					header = header +"<th align='right'>Delivery Date: " + this.oLocalData.Change.DeliveryDate + "</th>";
					header = header +"</tr><tr>";
					header = header +"<td><strong>Cost Center: </strong>" + this.oLocalData.CostCenterID + " - " + this.oLocalData.CostCenter + "</td>";
					header = header +"<td align='right'><strong>Recipient: </strong>" + this.oLocalData.Change.Recipient + "</td>";
					header = header +"</tr><tr>";
					header = header +"<td><strong>Requisitioner: </strong>" + this.oLocalData.Change.Requisitioner + "</td>";
					header = header +"<td align='right'><strong>Unloading point: </strong>" + this.oLocalData.Change.UnloadingPoint + "</td>";
					header = header +"</tr></thead>";
					header = header +"<tbody></tbody></table><br>";
					
				var table ="<table class='blueTable' width='100%'>";
				table = table + "<thead><tr><th>Item No</th>";
				table = table + "<th>PO No</th>";
				table = table + "<th>Material #</th>";
				table = table + "<th>Description</th>";
				table = table + "<th>Quantity</th></thead>";
				for(var i = 0; i < oData.results.length; i++){
					table += "<tr>";
					table += "<td>" + oData.results[i].Day0.PRID + "</td>";
					table += "<td>" + oData.results[i].Day0.POID + "</td>";
					table += "<td>" + oData.results[i].MaterialID + "</td>";
					table += "<td>" + oData.results[i].MaterialText + "</td>";
					table += "<td>" + formatter.currencyValue(oData.results[i].Day0.Quantity) + " " +  oData.results[i].Day0.UOM + "</td>";
					table += "</tr>";
				}
				table += "</table>";
				var ctrlstr = "toolbar=no,width=700px,height=600px";
				
				var wind = window.open("","Print",ctrlstr);
				wind.document.write(bhtml + header + table + ehtml);
				}				
			}
	});

});