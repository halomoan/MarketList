sap.ui.define([
	"sap/ui/demo/masterdetail/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/demo/masterdetail/model/formatter"
], function(BaseController,JSONModel,formatter) {
	"use strict";

	return BaseController.extend("sap.ui.demo.masterdetail.controller.MDSMarketList", {
			formatter: formatter,
	
			_oJsonModel : new JSONModel(),
			onInit: function() {
				sap.ui.getCore().getEventBus().subscribe("marketlist","addMaterial",this._addMaterial,this);
				var oViewData = {
					totalMaterials: 0,
					totalPrice: 0.00,
					deliveryDate : "9999-12-31",
					PurReqID: "",
					TrackingNo : "HELD"
				};
				this.globalData = {
			    	iRefresh : 0,
			    	tableChanged : false,
			    	deliveryDate : '0000-00-00',
			    	dayId : 0,
			    	templtChanged : false
				};
			
				var oViewModel = new JSONModel(oViewData);
				this.setModel(oViewModel, "detailView");
				this.setDeviceModel();
				
				if(!sap.ui.Device.system.phone) {
					this.getRouter().getRoute("dsmaster").attachPatternMatched(this._onMasterMatched, this);
				}else{
					this.getRouter().getRoute("mastermobile").attachPatternMatched(this._onMasterMatched, this);
				}
				
				var binding =  new sap.ui.model.Binding(this._oJsonModel, "/rows", this._oJsonModel.getContext("/rows"));
							binding.attachChange(function() {
									this._onTableChanged(this._oJsonModel);
									
							}.bind(this));
					    
				
			},
			_onMasterMatched :  function() {
				if (this.globalData.iRefresh === 0) {
					this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
				}
			},
			_onMetadataLoaded: function(){
		
				var oViewModel = this.getModel("detailView");
				//var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
				var oLocalData = this.getLocalData();
				
				var oModelHeader = new JSONModel();
				var oView = this.getView();
				var oThis = this;
				
				if (oLocalData) {
					
					oViewModel.setProperty("/PlantID",oLocalData.PlantID);
					oViewModel.setProperty("/Plant",oLocalData.Plant);
					oViewModel.setProperty("/CostCenterID",oLocalData.CostCenterID);
					oViewModel.setProperty("/CostCenterText",oLocalData.CostCenter);
					oViewModel.setProperty("/UnloadingPoint",oLocalData.UnloadingPoint);
					oViewModel.setProperty("/UserId",oLocalData.UserId);
				}
				var oModel = this.getOwnerComponent().getModel();
				var oFilters = [];
				oFilters.push( new sap.ui.model.Filter("PlantID", sap.ui.model.FilterOperator.EQ, oLocalData.PlantID) );
				oFilters.push( new sap.ui.model.Filter("CostCenterID", sap.ui.model.FilterOperator.EQ, oLocalData.CostCenterID) );
				oFilters.push( new sap.ui.model.Filter("UnloadingPoint", sap.ui.model.FilterOperator.EQ, oLocalData.UnloadingPoint) );
				//oFilters.push( new sap.ui.model.Filter("Date", sap.ui.model.FilterOperator.EQ, dateFormat.format(new Date( (new Date()).getTime() + (24 * 60 * 60 * 1000)))));
				
				if (oLocalData.mode === "Create") {				
					oFilters.push( new sap.ui.model.Filter("MarketListHeaderID", sap.ui.model.FilterOperator.EQ, "CREATE"));
					oFilters.push( new sap.ui.model.Filter("Date", sap.ui.model.FilterOperator.EQ, oLocalData.Create.DeliveryDate.replace(/-/g, "")));
				} else {
					oFilters.push( new sap.ui.model.Filter("Date", sap.ui.model.FilterOperator.EQ, oLocalData.Date.replace(/-/g, "")));
				}
				
				
				sap.ui.core.BusyIndicator.show();
				oModel.read("/MarketListHeaderSet", {
				    urlParameters: {
				        "$expand": "NavDetail"
				    },
				    filters: oFilters,
				    success: function(rData) {
				    	
				    	
				    	var oHeader = rData.results[0];
				    	
				    	//oLocalData = oStorage.get("localStorage");
				    	oLocalData.Recipient = oHeader.Recipient;
				    	//oLocalData.TrackingNo = oHeader.TrackingNo;
				    	oLocalData.TrackingNo = "HELD";
				    	oViewModel.setProperty("/Recipient",oLocalData.Recipient);
						oViewModel.setProperty("/TrackingNo",oLocalData.TrackingNo);
				    	//oStorage.put("localStorage",oLocalData);
				    	oThis.putLocalData(oLocalData);
				    	
				    	oThis.globalData.MarketListID = oHeader.MarketListHeaderID;
				    	
				    	oThis.globalData.deliveryDate = oHeader.TableH.Date0;
				    	oViewModel.setProperty("/deliveryDate",oHeader.TableH.Date0);
					    oViewModel.setProperty("/PurReqID",oHeader.TableH.PRID0);
				    	
				    	oModelHeader.setData(oHeader.TableH);
				    	oView.setModel(oModelHeader,"TableH");
				    	
				    	var oDetail = oHeader.NavDetail.results;
				    	
				    	if (!oDetail) {
							oThis._oJsonModel.setData({ rows : [] } );
						} else{
				    		oThis._oJsonModel.setData({ rows : oDetail } );
				    		oThis._onTableChanged(oThis._oJsonModel);
						}
				    	
					    oView.setModel(oThis._oJsonModel,"mktlist");
					    
					    
				    	sap.ui.core.BusyIndicator.hide();
				    	
				    },
				    error: function() {
			            sap.ui.core.BusyIndicator.hide();
			        }
				});
				
			
			},
			
			_onTableChanged : function(oModelJson) {
				
					var data = oModelJson.getProperty("/rows");
			
					
					if(data) {
					
						var noItems = [], totals = [];
						
						for (var key in data) {
							for (var prop in data[key]){
								
								
								if(prop.substring(0,4) === "Day0") {
									
									var oDay = data[key][prop];

									if (oDay.Enabled && oDay.Quantity > 0) {
										noItems[oDay.Date] = isNaN(noItems[oDay.Date]) ? 1 : (noItems[oDay.Date] + 1);
										
										if (isNaN(totals[oDay.Date])) {
											totals[oDay.Date] = (oDay.Quantity / data[key].PriceUnit * data[key].UnitPrice);
										}else{
											totals[oDay.Date] = totals[oDay.Date] + (oDay.Quantity / data[key].PriceUnit * data[key].UnitPrice);
										}
									} else{
										if (isNaN(noItems[oDay.Date])) {
											noItems[oDay.Date] = 0;
										}
										if (isNaN(totals[oDay.Date])) {
											totals[oDay.Date] = 0.00;
										}
									}
								} 
							}
							
						}
						
						var oViewModel = this.getModel("detailView");
						
						oViewModel.setProperty("/totalMaterials", noItems[this.globalData.deliveryDate]);
						oViewModel.setProperty("/totalPrices",formatter.currencyValue(totals[this.globalData.deliveryDate] ));
						
					}
					this.globalData.iRefresh++;
			
			},

			_addMaterial: function(sChannel,sEvent,oData){
				
				if (oData ) {
					
					//var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
				
						
					var tableRows = this._oJsonModel.getData().rows;
					if (!tableRows){
						
						this._oJsonModel.setData({ rows : [] } );
						this.getView().setModel(this._oJsonModel,"mktlist");
						tableRows = this._oJsonModel.getData().rows;
						
					}
					
					var bNew = true,bAdded = false;
					for (var i = 0; i < oData.data.length; i++ ){
						
						bNew = true;
						
						if (tableRows){
							for (var j = 0; j < tableRows.length; j++){
								if (tableRows[j].MaterialID === oData.data[i].MaterialID ){
									bNew = false;
									j = tableRows.length + 1;
								} 
								
							}
						}
						
						if (bNew) {
				
							//var oTableH = this.getView().getModel("TableH").getData();
							var oLocalData = this.getLocalData();
							oData.data[i].Day0.Date = oLocalData.Create.DeliveryDate;
							this.globalData.deliveryDate = oData.data[i].Day0.Date;
							/*oData.data[i].Day1.Date = oTableH.Date1;
							oData.data[i].Day2.Date = oTableH.Date2;
							oData.data[i].Day3.Date = oTableH.Date3;
							oData.data[i].Day4.Date = oTableH.Date4;
							oData.data[i].Day5.Date = oTableH.Date5;
							oData.data[i].Day6.Date = oTableH.Date6;*/
							
							oData.data[i].Day0.PRID = "00000";
							/*oData.data[i].Day1.PRID = "00000";
							oData.data[i].Day2.PRID = "00000";
							oData.data[i].Day3.PRID = "00000";
							oData.data[i].Day4.PRID = "00000";
							oData.data[i].Day5.PRID = "00000";
							oData.data[i].Day6.PRID = "00000";*/
							
							oData.data[i].Day0.Enabled = true;
							/*oData.data[i].Day1.Enabled = true;
							oData.data[i].Day2.Enabled = true;
							oData.data[i].Day3.Enabled = true;
							oData.data[i].Day4.Enabled = true;
							oData.data[i].Day5.Enabled = true;
							oData.data[i].Day6.Enabled = true;*/
							
							oData.data[i].MarketListHeaderID =  this.globalData.MarketListID;
							oData.data[i].MarketListDetailID = "MKD0001";
							oData.data[i].New = true;
						
							
							tableRows.push(oData.data[i]);
							bAdded = true;
						} else {
							sap.m.MessageToast.show(oData.data[i].MaterialID + " - " + oData.data[i].MaterialText + " is already in the table.",{});	
						}
					}
					
					if (bAdded) {
						this.globalData.tableChanged = true;
						this._oJsonModel.refresh();
						//sap.ui.getCore().byId("__component0---splitapp--idAppControl").hideMaster();
					}

				}
			},
			tabChanged : function(oEvent){
				/*var mode = this.byId("LDay" + this.globalData.dayId).getMode();
				if (mode !== sap.m.ListMode.None) {
					this.byId("LDay" + this.globalData.dayId).setMode(sap.m.ListMode.None);
					this.byId("toggleTemplate").setText("Show Template");
				}
				*/
				var oViewModel = this.getModel("detailView");
				if (this.globalData.templtChanged) {
					this.globalData.templtChanged = false;
					this._oJsonModel.refresh();
				}
				var id = oEvent.getParameters().section.getId();
				this.globalData.dayId = id.substr(id.length - 1);
				id = oEvent.getParameters().section.getTitle(); 
				this.globalData.deliveryDate = id.substr(id.length - 10);
				
				
				var oTableH = this.getView().getModel("TableH").getData();
				oViewModel.setProperty("/deliveryDate",oTableH["Date"+ this.globalData.dayId]);
				oViewModel.setProperty("/PurReqID",oTableH["PRID"+ this.globalData.dayId]);
				
				this._onTableChanged(this._oJsonModel);
				
				
			},
			onClose: function(){
				var oThis = this;
				var oSplit = sap.ui.getCore().byId("__component0---splitapp--idAppControl");
				if (this.globalData.tableChanged === true) {
					sap.m.MessageBox.confirm(this.getResourceBundle().getText("msgConfirmUnsavedClose"),{
							icon: sap.m.MessageBox.Icon.INFORMATION,
							title: this.getResourceBundle().getText("confirm"),
							actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
							onClose: function(oAction){
								if (oAction === sap.m.MessageBox.Action.YES) {
									oThis.globalData.tableChanged = false;
									oThis.globalData.iRefresh = 0;
									
									if (oSplit) {
										oSplit.hideMaster();
									}
									//oThis.getRouter().navTo("home", null, false);
									var oLocalData = oThis.getLocalData();
									oThis.getRouter().navTo("plancalendar", {
										plantId: oLocalData.PlantID,
										ccId: oLocalData.CostCenterID,
										date : oLocalData.Date
									}, false);
								
								}
							}
						});
				} else{
					this.globalData.tableChanged = false;
					this.globalData.iRefresh = 0;
					if (oSplit) {
						oSplit.hideMaster();
					}
					//this.getRouter().navTo("home", null, false);
					var oLocalData = this.getLocalData();
					this.getRouter().navTo("plancalendar", {
						plantId: oLocalData.PlantID,
						ccId: oLocalData.CostCenterID,
						date : oLocalData.Date
					}, false);
					
				}
			
			},
			onSubmit: function() {
				if (!this._oViewFormSubmit) {
					this._oViewFormSubmit = sap.ui.xmlfragment("sap.ui.demo.masterdetail.view.submitForm", this);
					this.getView().addDependent(this._oViewFormSubmit);
					// forward compact/cozy style into Dialog
					this._oViewFormSubmit.addStyleClass(this.getOwnerComponent().getContentDensityClass());
				}
				
				
				this._oViewFormSubmit.open();
			},
			doSaveData: function() {
				
				var tableRows = this._oJsonModel.getData().rows;
				var oModel = this.getView().getModel();
				var oViewModel = this.getModel("detailView");
				var oTableH = this.getView().getModel("TableH");
				var oThis = this;
				
				
				var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
				var oLocalData = oStorage.get("localStorage");
				
				oLocalData.Recipient = oViewModel.getProperty("/Recipient");
				oLocalData.TrackingNo = oViewModel.getProperty("/TrackingNo");
				oLocalData.UnloadingPoint = oViewModel.getProperty("/UnloadingPoint");
				oLocalData.MarketListHeaderID = this.globalData.MarketListID;
				oStorage.put("localStorage",oLocalData);
                            	
				var oHeader = {};
				oHeader.PlantID = oLocalData.PlantID;
				oHeader.CostCenterID = oLocalData.CostCenterID;
				oHeader.UnloadingPoint = oLocalData.UnloadingPoint;
				oHeader.MarketListHeaderID = oLocalData.MarketListHeaderID;
				oHeader.CostCenterText = "";
				oHeader.Plant = "";
				oHeader.Requisitioner = oLocalData.UserId;
				oHeader.Recipient = oLocalData.Recipient;
				oHeader.TrackingNo = oLocalData.TrackingNo;
				oHeader.PurchGroup = this.globalData.PurchasingGroup;
				oHeader.Date = "";
				oHeader.TableH = [];
				
				var oHeaderD = {};

				oHeaderD.Date0 = oTableH.getProperty("/Date0");
				oHeaderD.PRID0 = oTableH.getProperty("/PRID0");
				oHeader.TableH = oHeaderD;
				
				oHeaderD.Date1 = oTableH.getProperty("/Date1");
				oHeaderD.PRID1 = oTableH.getProperty("/PRID1");
				oHeader.TableH = oHeaderD;
			                                               
				oHeaderD.Date2 = oTableH.getProperty("/Date2");
				oHeaderD.PRID2 = oTableH.getProperty("/PRID2");
				oHeader.TableH = oHeaderD;
			
				oHeaderD.Date3 = oTableH.getProperty("/Date3");
				oHeaderD.PRID3 = oTableH.getProperty("/PRID3");
				oHeader.TableH = oHeaderD;

				oHeaderD.Date4 = oTableH.getProperty("/Date4");
				oHeaderD.PRID4 = oTableH.getProperty("/PRID4");
				oHeader.TableH = oHeaderD;
			
				oHeaderD.Date5 = oTableH.getProperty("/Date5");
				oHeaderD.PRID5 = oTableH.getProperty("/PRID5");
				oHeader.TableH = oHeaderD;
			
				oHeaderD.Date6 = oTableH.getProperty("/Date6");
				oHeaderD.PRID6 = oTableH.getProperty("/PRID6");
				oHeader.TableH = oHeaderD;
			
				oHeader.NavDetail = {};
				oHeader.NavDetail.results = [];
			
			
				for(var i in tableRows){
					var oDetail = {};
					oDetail.MarketListDetailID = oLocalData.MarketListDetailID ?  oLocalData.MarketListDetailID : this.globalData.MarketListDetailID ;
					oDetail.MarketListHeaderID = oLocalData.MarketListHeaderID ? oLocalData.MarketListHeaderID : this.globalData.MarketListHeaderID ;
					oDetail.MaterialGroupID = tableRows[i].MaterialGroupID;
					oDetail.MaterialID = tableRows[i].MaterialID;
					oDetail.MaterialText = tableRows[i].MaterialText;
					oDetail.UnitPrice = tableRows[i].UnitPrice;
					oDetail.Currency = tableRows[i].Currency;
					oDetail.PriceUnit = tableRows[i].PriceUnit;
					oDetail.InTemplate = tableRows[i].InTemplate;
					oDetail.TemplatePRID = tableRows[i].TemplatePRID;

					
					oDetail.Day0 = tableRows[i].Day0;
					delete oDetail.Day0.Error;
					
					oDetail.Day1 = tableRows[i].Day1;
					delete oDetail.Day1.Error;
					
					oDetail.Day2 = tableRows[i].Day2;
					delete oDetail.Day2.Error;
					
					oDetail.Day3 = tableRows[i].Day3;
					delete oDetail.Day3.Error;
					
					oDetail.Day4 = tableRows[i].Day4;
					delete oDetail.Day4.Error;
					
					oDetail.Day5 = tableRows[i].Day5;
					delete oDetail.Day5.Error;
					
					oDetail.Day6 = tableRows[i].Day6;
					delete oDetail.Day6.Error;
					
					oHeader.NavDetail.results.push(oDetail);
				}
				
				//console.log(oHeader);
				//return;
				oModel.create("/MarketListHeaderSet", oHeader, {
			    	method: "POST",
				    success: function(data) {
				    	
				    	//console.log(data.TableH);
				    	
				    	
				    	oTableH.setProperty("/PRID0",data.TableH.PRID0);
				    	oTableH.setProperty("/PRID1",data.TableH.PRID1);
				    	oTableH.setProperty("/PRID2",data.TableH.PRID2);
				    	oTableH.setProperty("/PRID3",data.TableH.PRID3);
				    	oTableH.setProperty("/PRID4",data.TableH.PRID4);
				    	oTableH.setProperty("/PRID5",data.TableH.PRID5);
				    	oTableH.setProperty("/PRID6",data.TableH.PRID6);
				    	
				    	oViewModel.setProperty("/PurReqID",oTableH.getProperty("/PRID" + oThis.globalData.dayId));
				    	
				    	if(data.NavDetail) {
					    	for(i in data.NavDetail.results) {
								tableRows[i].Day0 = data.NavDetail.results[i].Day0;
								tableRows[i].Day1 = data.NavDetail.results[i].Day1;
								tableRows[i].Day2 = data.NavDetail.results[i].Day2;
								tableRows[i].Day3 = data.NavDetail.results[i].Day3;
								tableRows[i].Day4 = data.NavDetail.results[i].Day4;
								tableRows[i].Day5 = data.NavDetail.results[i].Day5;
								tableRows[i].Day6 = data.NavDetail.results[i].Day6;
							}
				    	}
				    	
				    	oThis.globalData.tableChanged = false;
				    	sap.m.MessageBox.success(oThis.getResourceBundle().getText("msgSuccessSave"), {
				            title: "Success",                                      
				            initialFocus: null                                   
				        });
				    	if (oThis._oViewFormSubmit) {
							oThis._oViewFormSubmit.close();
							oThis.getRouter().navTo("plancalendar", {
								plantId: oLocalData.PlantID,
								ccId: oLocalData.CostCenterID,
								date : oLocalData.Date
							}, false);
						}
				    },
				    error: function(e) {
				    	sap.m.MessageBox.success(oThis.getResourceBundle().getText("msgFailSave"), {
				            title: "Failed",                                      
				            initialFocus: null                                   
				        });
				    }
			   });
			   	
				
			},
			closeSaveDialog: function() {
				if (this._oViewFormSubmit) {
					this._oViewFormSubmit.close();
				}
			},
			closeInfoDialog: function(){
					if (this._oHPopover) {
					this._oHPopover.close();
				}
			},
			inputChange: function(oEvent){
				
				var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
				  maxFractionDigits: 2,
				  groupingEnabled: true,
				  groupingSeparator: ",",
				  decimalSeparator: "."
				});
				
				var qty = oEvent.getParameters().value.replace(/[\,|\.]/g,"");
				var sPath = oEvent.getSource().getBindingContext("mktlist").getPath();
				var material = this.getView().getModel("mktlist").getProperty(sPath);
				var id = oEvent.getParameters().id.substring(7, 8);
				var sMsg = "";
				var oThis = this;
				var matDay = material["Day" + id];
				
				matDay.Error = false;
				
				if (isNaN(qty)) {
					sMsg = this.getResourceBundle().getText("msgErrNumber");
					sap.m.MessageBox.success(sMsg, {
				            title: "Error",                                      
				            initialFocus: null                                   
				        });
				    matDay.Error = true;
				    
				    
				} else if( matDay.Quantity > 0 ) {
					
					if (matDay.UOM !== material.OrderUnit) {
						var orderqty = (material.FactorToUOM > 0) ? matDay.Quantity / material.FactorToUOM : 0;
						sMsg = this.getResourceBundle().getText("msgConvertedOrder",[oNumberFormat.format(orderqty),material.OrderUnit]);
						
						if (!material.AllowDec) {
							if (orderqty % 1 !== 0) {
								
					
								matDay.Error = true;
								sMsg = sMsg + "\n\r" + 	this.getResourceBundle().getText("msgOrderAsWhole",[oNumberFormat.format(orderqty)]);
							}
						}
					
						if (orderqty < material.MinOrder) {
							sMsg = sMsg + "\n\r" + this.getResourceBundle().getText("msgMinOrder",[oNumberFormat.format(orderqty),oNumberFormat.format(material.MinOrder)]);
					
							matDay.Error = true;
							
						
						}
						
						if (!material.AllowDec) {
							if ((matDay.Quantity % 1) !== 0) {
					
								matDay.Error = true;
								sMsg = sMsg + "\n\r" + 	this.getResourceBundle().getText("msgOrderAsWhole",[oNumberFormat.format(matDay.Quantity)]);
							}
						}
						
						sMsg = sMsg + "\n\r\n\r" + this.getResourceBundle().getText("msgUnitConversion",[oNumberFormat.format(material.FactorToUOM),matDay.UOM,material.OrderUnit]);
						sap.m.MessageBox.success(sMsg, {
				            title: "Information",                                      
				            initialFocus: null,
				            onClose: function(){
				            	if (matDay.Quantity > 500) {
									sap.m.MessageToast.show(oThis.getResourceBundle().getText("msgMoreThen",[500]));
								}
								var price = matDay.Quantity * material.UnitPrice / material.PriceUnit;
								if (price > 1000){
									sap.m.MessageToast.show(oThis.getResourceBundle().getText("msgCostMore",[1000]));
								}
				            }
				        });
					} else {
						if (matDay.Quantity > 500) {
							sap.m.MessageToast.show(oThis.getResourceBundle().getText("msgMoreThen",[500]));
						}
						var price = matDay.Quantity * material.UnitPrice / material.PriceUnit;
						if (price > 1000){
						sap.m.MessageToast.show(oThis.getResourceBundle().getText("msgCostMore",[1000]));
						}
					} 
					
				}
				this.globalData.tableChanged = true;
			},
			addCommentPress: function(oEvent){
				var oSource = oEvent.getSource();
				var text = oSource.data("myText");
				var sId = oSource.data("myId");
				var enabled = oSource.data("Enabled");
				var sComment = oSource.data("myComment");
				var oModel = this._oJsonModel;
				var oThis = this;
			
				
				var itemId = sId.substr(0,sId.length - 3);
				var itemIdx = parseInt(sId.slice(-2));
				
				var dialog = new sap.m.Dialog({
					title: this.getResourceBundle().getText("addComment") + " " + text + " (" + itemId + ")" ,
					type: 'Message',
					content: [
							new sap.m.TextArea('commentTextArea', {
								width: '100%',
								placeholder: 'Add comment (optional)',
								value : sComment
							})
						],
							buttons : [
				        new sap.m.Button({
				            text: (enabled ? this.getResourceBundle().getText("delete") : this.getResourceBundle().getText("undelete")),
				            press: function(){
				            	
				            	//console.log(oParentEvent.getSource().getModel("mktlist"));
				            	var rows = oModel.getData().rows;

								for(var key in rows) {
									if (rows[key].MaterialID === itemId){
										rows[key]["Day" + itemIdx].Enabled = !(rows[key]["Day" + itemIdx].Enabled);
										oModel.refresh();
										oThis.globalData.tableChanged = true;
										break;
									}
								}
				            	dialog.close();
				            }
				        }),
				        new sap.m.Button({
							text:  this.getResourceBundle().getText("saveComment"),
							press: function () {
									
								var sText = sap.ui.getCore().byId('commentTextArea').getValue();
								sap.m.MessageToast.show('Add Comment : ' + sText);
								var rows = oModel.getData().rows;

								for(var key in rows) {
									if (rows[key].MaterialID === itemId){
										rows[key]["Day" + itemIdx].Comment = sText;
										oModel.refresh();
										oThis.globalData.tableChanged = true;
										break;
									}
								}
								dialog.close();
								
							}
						}),
						new sap.m.Button({
							text: this.getResourceBundle().getText("cancel"),
							press: function () {
								dialog.close();
							}
						})
				        ],
						afterClose: function() {
							dialog.destroy();
						}
				});

				dialog.open();
			},
			/*toggleTemplate: function(){
				var oList = this.byId("LDay" + this.globalData.dayId);
				var oItems = oList.getSelectedItems();

				var mode = oList.getMode();
				if (mode === sap.m.ListMode.None) {
					this.byId("toggleTemplate").setText("Hide Template");
					this.byId("LDay" + this.globalData.dayId).setMode(sap.m.ListMode.MultiSelect);
				} else {
					this.byId("toggleTemplate").setText("Show Template");
					this.byId("LDay" + this.globalData.dayId).setMode(sap.m.ListMode.None);
				}
				oList.setSelectedItem(oItems,false);
			},*/
			toggleTemplate: function(oEvent){
				var oSource = oEvent.getSource();
				var sPath = oSource.getBindingContext("mktlist").getPath();
				var material = this.getView().getModel("mktlist").getProperty(sPath);
				
				var color = oSource.getColor();
				if (color === "Neutral") {
					oSource.setColor("Critical");
					material.InTemplate = true;
				}else{
					oSource.setColor("Neutral");
					material.InTemplate = false;
				}
				
				this.globalData.templtChanged = true;
			},
			
			deleteRow: function(oEvent){
				var oItem = oEvent.getParameter("listItem");
				var sPath = oItem.getBindingContext("mktlist").getPath();
				var material = oItem.getModel("mktlist").getProperty(sPath);
				
				
				if (material.hasOwnProperty("New") || material.MarketListHeaderID === "CREATE" ){
					var tableRows = this._oJsonModel.getData().rows;
					for (var i in tableRows){
						if (tableRows[i].MaterialID === material.MaterialID) {
							tableRows.splice(i,1);
							break;
						}
					}
					this._oJsonModel.refresh();
				} else {
						sap.m.MessageBox.warning(this.getResourceBundle().getText("msgFailDelete1"), {
				            title: "Warning",                                      
				            initialFocus: null                                   
				        });	
				}
				
			},
			generatePO: function() {
				var oViewModel = this.getModel("detailView");
				var plantID = oViewModel.getProperty("/PlantID");
				var PRID = oViewModel.getProperty("/PurReqID");
				var oThis = this;
	
				
				if (PRID) {
					var dialog = new sap.m.Dialog({
						title: this.getResourceBundle().getText("confirm"),
						type: "Message",
						content: new sap.m.Text({ text: this.getResourceBundle().getText("msgConfirmCreatePO",[PRID]) }),
						beginButton: new sap.m.Button({
							text: this.getResourceBundle().getText("submit"),
							press: function () {
								
								
								sap.m.MessageToast.show(plantID + " - " + PRID);
								var oModel = oThis.getView().getModel();
								oModel.callFunction("/RunAutoPO", {
							               method: "POST",
							               urlParameters:  {"PlantID" : plantID, "PRID" : PRID  }, 
											success: function(oData, oResponse) {
												sap.m.MessageBox.success(oData.Message, {
										            title: "Response",                                      
										            initialFocus: null
										        });
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
					sap.m.MessageBox.warning(this.getResourceBundle().getText("msgNoPR"), {
				        title: "Warning",                                      
				        initialFocus: null                                   
				    });	
				}
			},
			headerInfoPopover: function(oEvent){
				
				if (!this._oHPopover) {
					this._oHPopover = sap.ui.xmlfragment("sap.ui.demo.masterdetail.view.headerPopOver", this);
				
					this.getView().addDependent(this._oHPopover);
				}
	
				this._oHPopover.openBy(oEvent.getSource());
			},
			onAddMaterial : function(){
				var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
				var oLocalData = oStorage.get("localStorage");
				if (oLocalData) {
					this.getRouter().navTo("masterpage", {plantId : oLocalData.PlantID, ccId : oLocalData.CostCenterID}, false);
				}
			
			},
			onExit: function() {
				sap.ui.getCore().getEventBus().unsubscribe("marketlist","addMaterial",this._addMaterial,this);
				if (this._oMaterialDialog) {
					this._oMaterialDialog.destroy();
				}
			}

	});

});