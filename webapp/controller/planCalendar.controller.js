sap.ui.define([
	"sap/ui/demo/masterdetail/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/demo/masterdetail/model/formatter"
], function(BaseController, JSONModel, formatter) {
	"use strict";

	return BaseController.extend("sap.ui.demo.masterdetail.controller.planCalendar", {
		formatter: formatter,

		onInit: function() {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "yyyy-MM-dd"
			});
			var oViewData = {
				calbusy: false,
				calbusyindicator: 0,
				showChange: false,
				ShowCosts: false,
				listbusy: false,
				POCreated: true,
				PurReqID: "",
				listbusyindicator: 0,
				totalAmount: 0.00,
				Date: dateFormat.format(new Date((new Date()).getTime() + (24 * 60 * 60 * 1000)))
			};
			var oViewModel = new JSONModel(oViewData);
			this.setModel(oViewModel, "detailView");

			this.getRouter().getRoute("plancalendar").attachPatternMatched(this._onMasterMatched, this);
		},
		_onMasterMatched: function(oEvent) {

			this.plantID = oEvent.getParameter("arguments").plantId;
			this.CostCenterID = oEvent.getParameter("arguments").ccId;
			this.oDate = new Date(oEvent.getParameter("arguments").date);

			var oViewModel = this.getModel("detailView");

			this.oLocalData = this.getLocalData();
			this.oLocalData.SourcePage = "planCal";
			this.oLocalData.Change = {};
			this.oLocalData.Change.PRID = null;
			this.putLocalData(this.oLocalData);
			
			this.arrCalendarItems = [];

			oViewModel.setProperty("/Plant", this.oLocalData.Plant);
			oViewModel.setProperty("/CostCenter", this.oLocalData.CostCenter);

			oViewModel.setProperty("/ShowVendor", this.oLocalData.ShowVendor);
			oViewModel.setProperty("/POCreated", true);
			oViewModel.setProperty("/PurReqID", "");
			oViewModel.setProperty("/UserType", this.oLocalData.UserType);

			var oJson = new JSONModel();
			this.setModel(oJson, "mktitem");

			this.refreshSchedule();

		},
		refreshSchedule: function() {
			var oModelSchedule = this.getOwnerComponent().getModel();
			var oViewModel = this.getModel("detailView");
			var oThis = this;

			var oFilters = [];
			oFilters.push(new sap.ui.model.Filter("Date", sap.ui.model.FilterOperator.EQ, this.oDate.getTime()));
			oFilters.push(new sap.ui.model.Filter("PlantID", sap.ui.model.FilterOperator.EQ, this.plantID));
			oFilters.push(new sap.ui.model.Filter("CostCenterID", sap.ui.model.FilterOperator.EQ, this.CostCenterID));

			oViewModel.setProperty("/calbusy", true);
			oModelSchedule.read("/ScheduleSet", {
				urlParameters: {
					"$expand": "NavScheduleToHeader/NavHeaderToItem"
				},
				filters: oFilters,
				success: function(rData) {
					var oSchedule = rData.results[0];
					var oJsonData = {};
					oJsonData.scheduleheader = oSchedule.NavScheduleToHeader.results;

					var arrItems = [];
					for (var idx in oJsonData.scheduleheader) {
						var arrResults = oJsonData.scheduleheader[idx].NavHeaderToItem.results;
						if (!arrResults){
							arrResults = oJsonData.scheduleheader[idx].NavHeaderToItem;
						}
						
						
						oJsonData.scheduleheader[idx].NavHeaderToItem = arrResults;
						arrItems.push(...arrResults);
					}
					var oJson = new JSONModel();
					
					oThis.arrCalendarItems = arrItems;
					
					
					oJson.setSizeLimit(300);
					oJson.setData(oJsonData);
					oJson.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);

					oThis.getView().setModel(oJson, "calModel");
					oViewModel.setProperty("/calbusy", false);

					var bShowCosts = oViewModel.getProperty("/ShowCosts");
					if (bShowCosts) {
						oThis._ShowCosts();
					}
				},
				error: function(oError) {
					oViewModel.setProperty("/calbusy", false);
				}
			});
		},
		onShowDetail: function(oEvent) {
			var oButton = oEvent.getSource();
			var oTopLayout = this.byId("topLayout");
			var oBottomLayout = this.byId("bottomLayout");

			if (oButton.getText() === this.getResourceBundle().getText("hideDetail")) {

				oTopLayout.setSize("100%");
				oBottomLayout.setSize("0%");
				oButton.setText(this.getResourceBundle().getText("showDetail"));

			} else {
				oTopLayout.setSize("auto");
				oBottomLayout.setSize("auto");
				oButton.setText(this.getResourceBundle().getText("hideDetail"));
			}
		},
		onStartDateChange: function(oEvent) {
			var oStartDate = oEvent.getSource().getStartDate();
			var sInterval = oEvent.getSource().getViewKey(); // "Week","One Month"
			
			var oEndDate = new Date(oStartDate);
			
			if(sInterval === "Week") {
				oEndDate.setDate(oEndDate.getDate() + 6);	
			} else {
				oEndDate.setDate(oEndDate.getDate() + 30);	
			}
			
			
			/*if (Math.abs(this._WeeksDiff(oStartDate,this.oDate)) >= 1) {
				this.oDate = oStartDate;
				this.refreshSchedule();
			}*/
			
			if (oStartDate.getMonth() !== this.oDate.getMonth()) {
				this.oDate = oStartDate;
				this.refreshSchedule();
			} else {
				var oViewModel = this.getModel("detailView");
				var bShowCosts = oViewModel.getProperty("/ShowCosts");
				if (bShowCosts) {
					this._ShowCosts();
				}
			}
			/*if (oStartDate.getFullYear() !== this.oDate.getFullYear()){
				this.oDate = oStartDate;
				this.refreshSchedule();
			}*/

		},

		_WeeksDiff: function(d1, d2) {
			var t2 = d2.getTime();
			var t1 = d1.getTime();

			return parseInt((t2 - t1) / (24 * 3600 * 1000 * 7));
		},
		onAppointmentSelect: function(oEvent) {
			var oAppointment = oEvent.getParameter("appointment");
			var oThis = this;
			var oButton = this.byId("showDetail");
			var oViewModel = this.getModel("detailView");
			var sPRID = oAppointment.getText();
			//var sStatus = oAppointment.getText();
			sPRID = sPRID.replace(/^\D+/g, "");
			sPRID = sPRID.trim();
			oViewModel.setProperty("/PurReqID", sPRID);
			oViewModel.setProperty("/POCreated", true);
			
			if (sPRID) {
				 navigator.clipboard.writeText(sPRID);
				 sap.m.MessageToast.show(this.getResourceBundle().getText("msgCopyToClipboard",sPRID));
			} else {
				return;
			}

			if (oAppointment.getType() === "Type06" && oButton.getText() === this.getResourceBundle().getText("showDetail")) {
				this._handlePRChange(oAppointment);
			}

			if (oButton.getText() === this.getResourceBundle().getText("hideDetail")) {

				if (oAppointment) {
					//var sSelected = oAppointment.getSelected() ? "selected" : "deselected";
					if (oAppointment.getType() === "Type06") {
						oViewModel.setProperty("/showChange", true);
					} else {
						oViewModel.setProperty("/showChange", false);
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
						MarketListHeaderID: sPRID
					});

					var oModel = this.getModel();
					oViewModel.setProperty("/listbusy", true);
					oModel.read(sObjectPath, {
						urlParameters: {
							"$expand": "NavDetail"
						},
						success: function(rData) {
							var oJson = new JSONModel();

							oJson.setData(rData.NavDetail);
							//Show Total Amount
							oThis._calcTotal(rData.NavDetail.results);
							oJson.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
							oThis.setModel(oJson, "mktitem");
							oThis.oLocalData.Change.Recipient = rData.Recipient;
							oThis.oLocalData.Change.Requisitioner = rData.Requisitioner;
							oThis.oLocalData.Change.PRTXT = rData.TableH.PRTXT0;
							oThis.putLocalData(oThis.oLocalData);

							if (!rData.TableH.LOCK0) {
								oViewModel.setProperty("/POCreated", false);
							}

							oViewModel.setProperty("/listbusy", false);
						},
						error: function(oError) {
							oViewModel.setProperty("/listbusy", false);
						}
					});
				}
			}

		},
		_calcTotal: function(data) {
			var oViewModel = this.getModel("detailView");
			var totals = 0;
			var currency = '';
			if (data) {
				for (var key in data) {
					currency = data[key].Currency;
					for (var prop in data[key]) {
						if (prop.substring(0, 4) === "Day0") {
							var oDay = data[key][prop];
							if (!oDay.Deleted && oDay.Quantity > 0) {
								var qty = parseFloat(oDay.Quantity);
								if (isNaN(qty)) {
									qty = 0;
								}
								var priceunit = parseFloat(data[key].PriceUnit);
								if (isNaN(priceunit)) {
									priceunit = 0;
								}
								var price = parseFloat(data[key].UnitPrice)
								if (isNaN(price)) {
									price = 0;
								}
								if (priceunit > 0) {
									totals = totals + (oDay.Quantity / priceunit * price);
								}
							}
						}
					}

				}
			}
			oViewModel.setProperty("/totalAmount", totals);
			oViewModel.setProperty("/currency", currency);

		},
		_handlePRChange: function(oAppointment) {
			if (!this._oViewChangePR) {
				this._oViewChangePR = sap.ui.xmlfragment("changePR", "sap.ui.demo.masterdetail.view.calRChangePR", this);
				this.getView().addDependent(this._oViewChangePR);
			}
			this._oViewChangePR.openBy(oAppointment);
			var oFrag = sap.ui.core.Fragment;
			var oDP = oFrag.byId("changePR", "prDate");
			oDP.setValue(this.getStringDate(oAppointment.getStartDate()));
			var oUP = oFrag.byId("changePR", "selectUPoint");

			oUP.destroyItems();
			var oUPItems = JSON.parse(this.oLocalData.UPoints);

			for (var i in oUPItems) {
				var item = new sap.ui.core.Item({
					key: oUPItems[i],
					text: oUPItems[i]
				});
				oUP.addItem(item);
			}

			oUP.setSelectedKey(oAppointment.getParent().getTitle());

			this.oLocalData.mode = "Change";
			this.oLocalData.Change = {};
			this.oLocalData.Create = null;

			var sPRID = oAppointment.getTitle();
			//this.oLocalData.SourcePage = "planCal";
			this.oLocalData.Change.PRID = sPRID.replace("PR: ", "");
			this.oLocalData.Change.UnloadingPoint = oAppointment.getParent().getTitle();
			this.oLocalData.Change.DeliveryDate = this.getStringDate(oAppointment.getStartDate());
			this.putLocalData(this.oLocalData);
		},
		handleIntervalSelect: function(oEvent) {

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
		onAddPR: function() {
			if (!this._oViewCreatePR) {
				this._oViewCreatePR = sap.ui.xmlfragment("addPR", "sap.ui.demo.masterdetail.view.calCreatePR", this);
				this.getView().addDependent(this._oViewCreatePR);
				this._oViewCreatePR.addStyleClass(this.getOwnerComponent().getContentDensityClass());
			}

			var oFrag = sap.ui.core.Fragment;
			var oSelect = oFrag.byId("addPR", "selectUPoint");
			oSelect.destroyItems();
			var oUPItems = JSON.parse(this.oLocalData.UPoints);

			for (var i in oUPItems) {
				var item = new sap.ui.core.Item({
					key: oUPItems[i],
					text: oUPItems[i]
				});
				oSelect.addItem(item);
			}
			oSelect.setSelectedKey(this.oLocalData.UnloadingPoint);

			var oDP = oFrag.byId("addPR", "startDate");

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
		onCreatePR: function() {
			var oFrag = sap.ui.core.Fragment;

			if (oFrag.byId("addPR", "startDate").getValueState() !== sap.ui.core.ValueState.Error) {

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
					this.oLocalData.Create.UnloadingPointID = oSelect.getSelectedItem().getKey();
				} else {
					this.oLocalData.Create.UnloadingPoint = this.oLocalData.UnloadingPoint;
					this.oLocalData.Create.UnloadingPointID = this.oLocalData.UnloadingPoint;
				}
				this.putLocalData(this.oLocalData);

				if (!sap.ui.Device.system.phone) {
					this.getRouter().navTo("dsmaster", null, false);
				} else {
					this.getRouter().navTo("mdsmaster", null, false);
				}
			}

		},
		onChangePR: function() {

			if (this.oLocalData.Change.PRID) {
				var PRID = this.oLocalData.Change.PRID;
				var plantID = this.oLocalData.PlantID;
				var oThis = this;
				var bChanged = false;

				var oFrag = sap.ui.core.Fragment;
				var oDP = oFrag.byId("changePR", "prDate");
				if (!oDP) {
					oDP = oFrag.byId("DchangePR", "prDate");
				}
				var newDate = oDP.getValue();
				var oUP = oFrag.byId("changePR", "selectUPoint");
				if (!oUP) {
					oUP = oFrag.byId("DchangePR", "selectUPoint");
				}

				var newUP = oUP.getSelectedItem().getKey();

				var msg = this.getResourceBundle().getText("msgConfirmChangePR", [PRID]);

				if (oDP.getValueState() === sap.ui.core.ValueState.Error) {
					sap.m.MessageToast.show(this.getResourceBundle().getText("msgWrongDateFuture"));
					return;
				}
				if (this.oLocalData.Change.DeliveryDate !== newDate) {
					msg = msg + "\n\r\n\r" + this.getResourceBundle().getText("msgDateFromTo", [this.oLocalData.Change.DeliveryDate, newDate]);
					bChanged = true;
				}

				if (this.oLocalData.Change.UnloadingPoint !== newUP) {
					msg = msg + "\n\r\n\r" + this.getResourceBundle().getText("msgUPFromTo", [this.oLocalData.Change.UnloadingPoint, newUP]);
					bChanged = true;
				}

				if (bChanged) {

					var dialog = new sap.m.Dialog({
						title: this.getResourceBundle().getText("confirm"),
						type: "Message",
						content: new sap.m.Text({
							text: msg
						}),
						beginButton: new sap.m.Button({
							text: this.getResourceBundle().getText("submit"),
							press: function() {

								var oModel = oThis.getView().getModel();
								oModel.callFunction("/ChangePR", {
									method: "POST",
									urlParameters: {
										"PlantID": plantID,
										"PRID": PRID,
										"DeliveryDate": newDate.replace(/-/g, ""),
										"UnloadingPoint": newUP
									},
									success: function(oData, oResponse) {
										sap.m.MessageBox.success(oData.Message, {
											title: "Response",
											initialFocus: null
										});
										oThis.refreshSchedule();
									},
									error: function(error) {},
									async: false

								});
								dialog.close();
							}
						}),
						endButton: new sap.m.Button({
							text: this.getResourceBundle().getText("cancel"),
							press: function() {
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
				if (this._oViewChangePR) {
					this._oViewChangePR.close();
				} else if (this.oViewDChangePR) {
					this._oViewChangePR.close();
				}
			}

		},
		onChangePRDetail: function() {
			if (this._oViewChangePR) {
				this._oViewChangePR.close();
			} else if (this.oViewDChangePR) {
				this._oViewChangePR.close();
			}

			if (this.oLocalData.mode === "Change") {
				if (!sap.ui.Device.system.phone) {
					this.getRouter().navTo("dsmaster", null, false);
				} else {
					this.getRouter().navTo("mdsmaster", null, false);
				}
			}

		},
		onCloseCreate: function() {
			this._oViewCreatePR.close();
		},
		onCloseChange: function() {
			if (this._oViewChangePR) {
				this._oViewChangePR.close();
			}

			if (this._oViewDChangePR) {
				this._oViewDChangePR.close();
			}
		},
		onChangeProduct: function() {

			if (!this._oViewDChangePR) {
				this._oViewDChangePR = sap.ui.xmlfragment("DchangePR", "sap.ui.demo.masterdetail.view.calDChangePR", this);
				this.getView().addDependent(this._oViewDChangePR);
			}
			this._oViewDChangePR.open();
			var oFrag = sap.ui.core.Fragment;
			var oDP = oFrag.byId("DchangePR", "prDate");
			oDP.setValue(this.oLocalData.Change.DeliveryDate);
			var oUP = oFrag.byId("DchangePR", "selectUPoint");
			oUP.destroyItems();

			var oUPItems = JSON.parse(this.oLocalData.UPoints);

			for (var i in oUPItems) {
				var item = new sap.ui.core.Item({
					key: oUPItems[i],
					text: oUPItems[i]
				});
				oUP.addItem(item);
			}
			oUP.setSelectedKey(this.oLocalData.UnloadingPointID);
		},
		onSearch: function(oEvent) {
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
				var msg = this.getResourceBundle().getText("msgConfirmCreatePO", [PRID]);
				var dialog = new sap.m.Dialog({
					title: "Generate PO",
					type: "Message",
					content: new sap.m.Text({
						text: msg
					}),
					beginButton: new sap.m.Button({
						text: this.getResourceBundle().getText("submit"),
						press: function() {

							var oModel = oThis.getView().getModel();
							oModel.callFunction("/RunAutoPO", {
								method: "POST",
								urlParameters: {
									"PlantID": plantID,
									"PRID": PRID
								},
								success: function(oData, oResponse) {
									sap.m.MessageBox.success(oData.Message, {
										title: "Response",
										initialFocus: null
									});
									oThis.refreshSchedule();
								},
								error: function(error) {},
								async: false

							});
							dialog.close();
						}
					}),
					endButton: new sap.m.Button({
						text: this.getResourceBundle().getText("cancel"),
						press: function() {
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
		onPrint: function() {
			var oData = this.getModel("mktitem").getData();
			var txtPrint = this.getResourceBundle().getText("print");
			var txtPR = this.getResourceBundle().getText("pr");
			var txtDeliveryDate = this.getResourceBundle().getText("deliveryDate");
			var txtCC = this.getResourceBundle().getText("costCenter");
			var txtReq = this.getResourceBundle().getText("requisitioner");
			var txtUP = this.getResourceBundle().getText("unloadingPoint");
			var txtRemark = this.getResourceBundle().getText("remark");
			var txtItem = this.getResourceBundle().getText("item");
			var txtMaterial = this.getResourceBundle().getText("material");
			var txtDesc = this.getResourceBundle().getText("description");
			var txtQty = this.getResourceBundle().getText("quantity");
			var txtCost = txtItem + " " + this.getResourceBundle().getText("cost");

			if (oData.results) {
				var bhtml = "<html><head><title>Market List</title><link rel='stylesheet' type='text/css' href='css/style.css'></head><body>";
				bhtml += "<basefont face='arial, verdana, sans-serif' color='#ff0000'>";
				var ehtml = "</body></html>";
				var header = "<center><h3>Market List Report</h3></center><hr>";
				header = header + "<div align='right'><button id='printPageButton' onclick='window.print(); window.close();'>" + txtPrint +
					"</button></div>";
				header = header + "<table width='100%' align='left'><thead><tr>";
				header = header + "<th align='left'>" + txtPR + " #: " + this.oLocalData.Change.PRID + "</th>";
				header = header + "<th align='right'>" + txtDeliveryDate + ": " + this.oLocalData.Change.DeliveryDate + "</th>";
				header = header + "</tr><tr>";
				header = header + "<td><strong>" + txtCC + ": </strong>" + this.oLocalData.CostCenterID + " - " + this.oLocalData.CostCenter +
					"</td>";
				header = header + "<td align='right'><strong>Recipient: </strong>" + this.oLocalData.Change.Recipient + "</td>";
				header = header + "</tr><tr>";
				header = header + "<td><strong>" + txtReq + ": </strong>" + this.oLocalData.Change.Requisitioner + "</td>";
				header = header + "<td align='right'><strong>" + txtUP + ": </strong>" + this.oLocalData.Change.UnloadingPoint + "</td>";
				header = header + "</tr><tr>";
				header = header + "<td><strong>" + txtRemark + ": </strong>" + this.oLocalData.Change.PRTXT + "</td>";
				header = header + "</tr></thead>";
				header = header + "<tbody></tbody></table><br>";

				var table = "<table class='blueTable' width='100%'>";
				table = table + "<thead><tr><th>" + txtItem + "</th>";
				table = table + "<th>PO No</th>";
				table = table + "<th>" + txtMaterial + " #</th>";
				table = table + "<th>" + txtDesc + "</th>";
				if (this.oLocalData.ShowVendor) {
					table = table + "<th>Vendor</th>";
				}
				table = table + "<th align='center'>" + txtQty + "</th>";
				table = table + "<th align='center'>" + txtCost + "</th></thead>";
				for (var i = 0; i < oData.results.length; i++) {
					table += "<tr>";
					table += "<td>" + oData.results[i].Day0.PRID + "</td>";
					table += "<td>" + oData.results[i].Day0.POID + "</td>";
					table += "<td>" + oData.results[i].MaterialID + "</td>";
					table += "<td>" + oData.results[i].MaterialText + "</td>";
					if (this.oLocalData.ShowVendor) {
						table += "<td>" + oData.results[i].VendorName + "</td>";
					}
					table += "<td align='right'>" + formatter.currencyValue(oData.results[i].Day0.Quantity) + " " + oData.results[i].Day0.UOM +
						"</td>";
					table += "<td align='right'>" + formatter.currencyValue(oData.results[i].Day0.Quantity / oData.results[i].PriceUnit * oData.results[
						i].UnitPrice) + " " + oData.results[i].Currency + "</td>";
					table += "</tr>";
				}
				table += "</table>";
				var ctrlstr = "toolbar=no,width=700px,height=600px";

				var wind = window.open("", "Print", ctrlstr);
				wind.document.write(bhtml + header + table + ehtml);
			}
		},
		onShowCosts: function() {
			var oViewModel = this.getModel("detailView");
			var bShowCosts = !oViewModel.getProperty("/ShowCosts");

			if (bShowCosts) {
				this._ShowCosts();
			} else {
				this._HideCosts();

			}
			oViewModel.setProperty("/ShowCosts", bShowCosts);
		},
		_HideCosts: function() {
			var oModel = this.getView().getModel("calModel");
			var oData = oModel.getData();
			
			if (oData.scheduleheader.length > 0) {
				
				var oHeader = oData.scheduleheader[0];
				if (oHeader.ScheduleHeaderID === "CALH000") {
					oData.scheduleheader.shift();
				}
					
				for(var idx in oData.scheduleheader) {
					oHeader = oData.scheduleheader[idx];
					oHeader.Role = "Unloading Point";
				}
				oModel.setData(oData, "calModel");
			}
			
		},
		_ShowCosts: function() {

			var oModel = this.getView().getModel("calModel");
			var oData = oModel.getData();

			
			
			if (oData.scheduleheader.length > 0) {
				var oHeader = oData.scheduleheader[0];
				if (oHeader.ScheduleHeaderID === "CALH000") {
					oData.scheduleheader.shift();
				}
			}
			
			var arrHeader = oData.scheduleheader;
			
			var oCalendar = this.byId("PC1");
			var oStartDate = oCalendar.getStartDate();
			var oEndDate = oCalendar.getEndDate();
			//add 1 hour
			oEndDate = oEndDate.setTime(oEndDate.getTime() + (60 * 60 * 1000));
			
			var dict = {};
			var dictUP = {};
			//var iTotal = 0;
			for(var idx in arrHeader) {
				var arrAppointments = arrHeader[idx].NavHeaderToItem;
				
				var UP = arrHeader[idx].Name;
				
				for (var i in arrAppointments) {
					var oAppointment = arrAppointments[i];
					if (oAppointment.StartDate >= oStartDate && oAppointment.StartDate <= oEndDate) {
						var oDate = new Date(oAppointment.StartDate.getFullYear(), oAppointment.StartDate.getMonth(), oAppointment.StartDate.getDate());
						
						var amount = parseFloat(oAppointment.Value);
						if (dict[oDate]) {
							dict[oDate] = dict[oDate] + amount;
						} else {
							dict[oDate] = amount;
						}
						
						if (dictUP[UP]) {
							dictUP[UP] = dictUP[UP] + amount;
						} else {
							dictUP[UP] = amount;
						}
						//iTotal = iTotal + amount;
					}
				}
				
				//arrHeader[idx].Role = this.formatter.currencyValue(iTotal);
				
			}
			
			console.log(dictUP);

			oHeader = {
				"Name": this.getResourceBundle().getText("totalCost"),
				"Pic": "sap-icon://money-bills",
				"Role": this.getResourceBundle().getText("valuation"),
				"ScheduleHeaderID": "CALH000",
				"ScheduleID": "CAL000",
				"NavHeaderToItem": []
			};

			for (var key in dict) {

				var oSDate = new Date(key);
				var oEDate = new Date(oSDate.getTime() + (23 * 60 * 60 * 1000) + (58 * 60 * 1000));
				var oItem = {
					"ScheduleHeaderID": "CALH000",
					"ScheduleItemID": "CALD000",
					"Tentative": false,
					"Info": "",
					"Title": "",
					"StartDate": oSDate,
					"EndDate": oEDate,
					"Color": "#32a852",
					"Value": dict[key],
					"Pic": "sap-icon://lead"
				};
				oHeader.NavHeaderToItem.push(oItem);
			}

			oData.scheduleheader.unshift(oHeader);
			oModel.setData(oData, "calModel");

		}
	});

});