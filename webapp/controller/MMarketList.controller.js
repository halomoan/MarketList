sap.ui.define([
	"sap/ui/demo/masterdetail/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/demo/masterdetail/model/formatter"
], function(BaseController,JSONModel,formatter) {
	"use strict";

	return BaseController.extend("sap.ui.demo.masterdetail.controller.MMarketList", {
			formatter: formatter,
	
			_oJsonModel : new JSONModel(),
			onInit: function() {
				sap.ui.getCore().getEventBus().subscribe("marketlist","addMaterial",this._addMaterial,this);
				var oViewData = {
					totalMaterials: 0,
					totalPrice: 0.00,
					deliveryDate : "9999-12-31",
					Currency: "",
					PurReqID: "",
					PurReqIdx: "0",
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
				
				var binding =  new sap.ui.model.Binding(this._oJsonModel, "/rows", this._oJsonModel.getContext("/rows"));
				binding.attachChange(function() {
					this._onTableChanged(this._oJsonModel);
				}.bind(this));
				
				//var oLocalData = this.getLocalData();
				
				//if(oLocalData.UseMobile) {
					this.getRouter().getRoute("dmaster").attachPatternMatched(this._onMasterMatched, this);
				//}else{
					this.getRouter().getRoute("mastermobile").attachPatternMatched(this._onMasterMatched, this);
				//}
				
			},
			_onMasterMatched :  function() {

				this.oLocalData = this.getLocalData();
				
				if (this.globalData.iRefresh === 0) {
					this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
				}
			},
			_onMetadataLoaded: function(){
				var oViewModel = this.getModel("detailView");
				
				var oModelHeader = new JSONModel();
				var oView = this.getView();
				var oThis = this;
				
			
				
				if (this.oLocalData) {
					
					oViewModel.setProperty("/PlantID",this.oLocalData.PlantID);
					oViewModel.setProperty("/Plant",this.oLocalData.Plant);
					oViewModel.setProperty("/CostCenterID",this.oLocalData.CostCenterID);
					oViewModel.setProperty("/CostCenterText",this.oLocalData.CostCenter);
					oViewModel.setProperty("/UnloadingPoint",this.oLocalData.UnloadingPoint);
					oViewModel.setProperty("/Currency",this.oLocalData.Currency);
					oViewModel.setProperty("/UserId",this.oLocalData.UserId);
					oViewModel.setProperty("/UserType",this.oLocalData.UserType);
				}
				var oModel = this.getOwnerComponent().getModel();
				var oFilters = [];
				oFilters.push( new sap.ui.model.Filter("PlantID", sap.ui.model.FilterOperator.EQ, this.oLocalData.PlantID) );
				oFilters.push( new sap.ui.model.Filter("CostCenterID", sap.ui.model.FilterOperator.EQ, this.oLocalData.CostCenterID) );
				oFilters.push( new sap.ui.model.Filter("UnloadingPoint", sap.ui.model.FilterOperator.EQ, this.oLocalData.UnloadingPoint) );
				//oFilters.push( new sap.ui.model.Filter("Date", sap.ui.model.FilterOperator.EQ, dateFormat.format(new Date( (new Date()).getTime() + (24 * 60 * 60 * 1000)))));
				oFilters.push( new sap.ui.model.Filter("Date", sap.ui.model.FilterOperator.EQ, this.oLocalData.Date.replace(/-/g, "")));
				
				sap.ui.core.BusyIndicator.show();
				
				
				oModel.read("/MarketListHeaderSet", {
				    urlParameters: {
				        "$expand": "NavDetail"
				    },
				    filters: oFilters,
				    success: function(rData) {
				    	
				    	
				    	var oHeader = rData.results[0];
				    	
				    	oThis.oLocalData.Recipient = oHeader.Recipient;
				    	//this.oLocalData.TrackingNo = oHeader.TrackingNo;
				    	oThis.oLocalData.TrackingNo = "HELD";
				    	oViewModel.setProperty("/Recipient",oThis.oLocalData.Recipient);
						oViewModel.setProperty("/TrackingNo",oThis.oLocalData.TrackingNo);
				    	oThis.putLocalData(oThis.oLocalData);
				    	
				    	oThis.globalData.deliveryDate = oHeader.TableH.Date0;
				    	oViewModel.setProperty("/deliveryDate",oHeader.TableH.Date0);
					    oViewModel.setProperty("/PurReqID",oHeader.TableH.PRID0);
						oViewModel.setProperty("/PurReqComment",oHeader.TableH.PRTXT0);
				    	
				    	oModelHeader.setData(oHeader.TableH);
				    	oView.setModel(oModelHeader,"TableH");
				    	
				    	var oDetail = oHeader.NavDetail.results;
				    	
				    	if (!oDetail) {
							oThis._oJsonModel.setData({ rows : [] } );
						} else{
							oThis._oJsonModel.setSizeLimit(500);
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
								if(prop.substring(0,3) === "Day") {
									
									var oDay = data[key][prop];
										
									if (!oDay.Deleted && oDay.Quantity > 0) {
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
						oViewModel.setProperty("/Costs",totals);
						
					}
					this.globalData.iRefresh++;
			
			},

			_addMaterial: function(sChannel,sEvent,oData){
				
				if (oData ) {
				
					var tableRows = this._oJsonModel.getData().rows;
					
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
				
							var oTableH = this.getView().getModel("TableH").getData();
							//this.globalData.deliveryDate = oTableH.Date0;
							
							oData.data[i].Day0.Date = oTableH.Date0;
							oData.data[i].Day1.Date = oTableH.Date1;
							oData.data[i].Day2.Date = oTableH.Date2;
							oData.data[i].Day3.Date = oTableH.Date3;
							oData.data[i].Day4.Date = oTableH.Date4;
							oData.data[i].Day5.Date = oTableH.Date5;
							oData.data[i].Day6.Date = oTableH.Date6;
							
							oData.data[i].Day0.PRID = "00000";
							oData.data[i].Day1.PRID = "00000";
							oData.data[i].Day2.PRID = "00000";
							oData.data[i].Day3.PRID = "00000";
							oData.data[i].Day4.PRID = "00000";
							oData.data[i].Day5.PRID = "00000";
							oData.data[i].Day6.PRID = "00000";
							
							oData.data[i].Day0.Enabled = true;
							oData.data[i].Day1.Enabled = true;
							oData.data[i].Day2.Enabled = true;
							oData.data[i].Day3.Enabled = true;
							oData.data[i].Day4.Enabled = true;
							oData.data[i].Day5.Enabled = true;
							oData.data[i].Day6.Enabled = true;
							
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
				
				var oList = this.byId("LDay" + this.globalData.dayId);
				var binding = oList.getBinding("items");
				binding.filter([]);
				
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
				
				//TODO
				oViewModel.setProperty("/PurReqIdx",this.globalData.dayId);
				oViewModel.setProperty("/PurReqComment",oTableH["PRTXT"+ this.globalData.dayId]);
				
				var oSearchField = this.getView().byId("searchField");
				oSearchField.setValue("");
				
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
									oThis.getRouter().navTo("home", null, false);
									
								}
							}
						});
				} else{
					this.globalData.tableChanged = false;
					this.globalData.iRefresh = 0;
					if (oSplit) {
						oSplit.hideMaster();
					}
				
					this.getRouter().navTo("home", null, false);
					
				}
			
			},
			onSubmit: function() {
				var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
				  maxFractionDigits: 2,
				  groupingEnabled: true,
				  groupingSeparator: ",",
				  decimalSeparator: "."
				});
				var oViewModel = this.getModel("detailView");
				var maxItemCost = this.oLocalData.MaxItemCost;
				var sMsg = "";
				
				var Costs = oViewModel.getProperty("/Costs");
				
				for(var index in Costs) {
					if (Costs[index] > maxItemCost) {
						sMsg = sMsg +  this.getResourceBundle().getText("msgMaxOrderCost",[index,oNumberFormat.format(Costs[index]),oNumberFormat.format(maxItemCost)]) + "\n";
					}
				}
			
				if(sMsg){
					sap.m.MessageBox.error(sMsg, {
				            title: "Error",                                      
				            initialFocus: null,
				            onClose: function(){
				            
				            }
				        });
				        return;
				} else{
					if (!this._oViewFormSubmit) {
						this._oViewFormSubmit = sap.ui.xmlfragment("sap.ui.demo.masterdetail.view.submitForm", this);
						this.getView().addDependent(this._oViewFormSubmit);
						// forward compact/cozy style into Dialog
						this._oViewFormSubmit.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					}
					
					
					this._oViewFormSubmit.open();
				}
			},
			doSaveData: function() {
				
				var tableRows = this._oJsonModel.getData().rows;
				var oModel = this.getView().getModel();
				var oViewModel = this.getModel("detailView");
				var oTableH = this.getView().getModel("TableH");
				var oThis = this;
				
				
			
				
				this.oLocalData.Recipient = oViewModel.getProperty("/Recipient");
				this.oLocalData.TrackingNo = oViewModel.getProperty("/TrackingNo");
				this.oLocalData.UnloadingPoint = oViewModel.getProperty("/UnloadingPoint");
				this.oLocalData.MarketListHeaderID = this.globalData.MarketListID;
				this.putLocalData(this.oLocalData);
                            	
				var oHeader = {};
				oHeader.PlantID = this.oLocalData.PlantID;
				oHeader.CostCenterID = this.oLocalData.CostCenterID;
				oHeader.UnloadingPoint = this.oLocalData.UnloadingPoint;
				oHeader.MarketListHeaderID = this.oLocalData.MarketListHeaderID;
				oHeader.CostCenterText = "";
				oHeader.Plant = "";
				oHeader.Requisitioner = this.oLocalData.UserId;
				oHeader.Recipient = this.oLocalData.Recipient;
				oHeader.TrackingNo = this.oLocalData.TrackingNo;
				oHeader.PurchGroup = this.globalData.PurchasingGroup;
				oHeader.Date = "";
				oHeader.TableH = [];
				
				var oHeaderD = {};

			oHeaderD.Date0 = oTableH.getProperty("/Date0");
				oHeaderD.PRID0 = oTableH.getProperty("/PRID0");
				oHeaderD.PRTXT0 = oTableH.getProperty("/PRTXT0");
				oHeader.TableH = oHeaderD;
				
				oHeaderD.Date1 = oTableH.getProperty("/Date1");
				oHeaderD.PRID1 = oTableH.getProperty("/PRID1");
				oHeaderD.PRTXT1 = oTableH.getProperty("/PRTXT1");
				oHeader.TableH = oHeaderD;
			                                               
				oHeaderD.Date2 = oTableH.getProperty("/Date2");
				oHeaderD.PRID2 = oTableH.getProperty("/PRID2");
				oHeaderD.PRTXT2 = oTableH.getProperty("/PRTXT2");
				oHeader.TableH = oHeaderD;
			
				oHeaderD.Date3 = oTableH.getProperty("/Date3");
				oHeaderD.PRID3 = oTableH.getProperty("/PRID3");
				oHeaderD.PRTXT3 = oTableH.getProperty("/PRTXT3");
				oHeader.TableH = oHeaderD;

				oHeaderD.Date4 = oTableH.getProperty("/Date4");
				oHeaderD.PRID4 = oTableH.getProperty("/PRID4");
				oHeaderD.PRTXT4 = oTableH.getProperty("/PRTXT4");
				oHeader.TableH = oHeaderD;
			
				oHeaderD.Date5 = oTableH.getProperty("/Date5");
				oHeaderD.PRID5 = oTableH.getProperty("/PRID5");
				oHeaderD.PRTXT5 = oTableH.getProperty("/PRTXT5");
				oHeader.TableH = oHeaderD;
			
				oHeaderD.Date6 = oTableH.getProperty("/Date6");
				oHeaderD.PRID6 = oTableH.getProperty("/PRID6");
				oHeaderD.PRTXT6 = oTableH.getProperty("/PRTXT6");
				oHeader.TableH = oHeaderD;
			
				oHeader.NavDetail = {};
				oHeader.NavDetail.results = [];
			
				var isValid = true;
				for(var i in tableRows){
					var oDetail = {};
					oDetail.MarketListDetailID = this.oLocalData.MarketListDetailID ?  this.oLocalData.MarketListDetailID : this.globalData.MarketListDetailID ;
					oDetail.MarketListHeaderID = this.oLocalData.MarketListHeaderID ? this.oLocalData.MarketListHeaderID : this.globalData.MarketListHeaderID ;
					oDetail.MaterialGroupID = tableRows[i].MaterialGroupID;
					oDetail.MaterialID = tableRows[i].MaterialID;
					oDetail.MaterialText = tableRows[i].MaterialText;
					oDetail.UnitPrice = tableRows[i].UnitPrice;
					oDetail.Currency = tableRows[i].Currency;
					oDetail.PriceUnit = tableRows[i].PriceUnit;
					oDetail.InTemplate = tableRows[i].InTemplate;
					oDetail.TemplatePRID = tableRows[i].TemplatePRID;

					
					oDetail.Day0 = tableRows[i].Day0;
					if(oDetail.Day0.hasOwnProperty("Error") && oDetail.Day0.Error) {
						isValid = false;
						this._oViewFormSubmit.close();
					} else {
						delete oDetail.Day0.Error;
					}
						
					
					oDetail.Day1 = tableRows[i].Day1;
					if(oDetail.Day1.hasOwnProperty("Error") && oDetail.Day1.Error) {
						isValid = false;
						this._oViewFormSubmit.close();
					} else {
						delete oDetail.Day1.Error;
					}
					
					
					oDetail.Day2 = tableRows[i].Day2;
					if(oDetail.Day2.hasOwnProperty("Error") && oDetail.Day2.Error) {
						isValid = false;
						this._oViewFormSubmit.close();
					} else {
						delete oDetail.Day2.Error;
					}
					
					
					oDetail.Day3 = tableRows[i].Day3;
					if(oDetail.Day3.hasOwnProperty("Error") && oDetail.Day3.Error) {
						isValid = false;
						this._oViewFormSubmit.close();
					} else {
						delete oDetail.Day3.Error;
					}
					
					
					oDetail.Day4 = tableRows[i].Day4;
					if(oDetail.Day4.hasOwnProperty("Error") && oDetail.Day4.Error) {
						isValid = false;
						this._oViewFormSubmit.close();
					} else {
						delete oDetail.Day4.Error;
					}
					
					
					oDetail.Day5 = tableRows[i].Day5;
					if(oDetail.Day5.hasOwnProperty("Error") && oDetail.Day5.Error) {
						isValid = false;
						this._oViewFormSubmit.close();
					} else {
						delete oDetail.Day5.Error;
					}
					
					
					oDetail.Day6 = tableRows[i].Day6;
					if(oDetail.Day6.hasOwnProperty("Error") && oDetail.Day6.Error) {
						isValid = false;
						this._oViewFormSubmit.close();
					} else {
						delete oDetail.Day6.Error;
					}
					
					
					if (!isValid){
						sap.m.MessageBox.error(this.getResourceBundle().getText("msgItemWrong",[oDetail.MaterialText,oDetail.MaterialID]), {
				            title: "Error",                                      
				            initialFocus: null                                   
				        });
				        return;
					}
					
					oHeader.NavDetail.results.push(oDetail);
				}
				
				sap.ui.core.BusyIndicator.show(0);
				oModel.create("/MarketListHeaderSet", oHeader, {
			    	method: "POST",
				    success: function(data) {
				    	
				    	sap.ui.core.BusyIndicator.hide();

				    	oTableH.setProperty("/PRID0",data.TableH.PRID0);
				    	oTableH.setProperty("/PRID1",data.TableH.PRID1);
				    	oTableH.setProperty("/PRID2",data.TableH.PRID2);
				    	oTableH.setProperty("/PRID3",data.TableH.PRID3);
				    	oTableH.setProperty("/PRID4",data.TableH.PRID4);
				    	oTableH.setProperty("/PRID5",data.TableH.PRID5);
				    	oTableH.setProperty("/PRID6",data.TableH.PRID6);
				    	
				    	oViewModel.setProperty("/PurReqID",oTableH.getProperty("/PRID" + oThis.globalData.dayId));
				    	
				    	for(i in data.NavDetail.results) {
							tableRows[i].Day0 = data.NavDetail.results[i].Day0;
							tableRows[i].Day1 = data.NavDetail.results[i].Day1;
							tableRows[i].Day2 = data.NavDetail.results[i].Day2;
							tableRows[i].Day3 = data.NavDetail.results[i].Day3;
							tableRows[i].Day4 = data.NavDetail.results[i].Day4;
							tableRows[i].Day5 = data.NavDetail.results[i].Day5;
							tableRows[i].Day6 = data.NavDetail.results[i].Day6;
						}
						
				    	
				    	oThis.globalData.tableChanged = false;
				    	sap.m.MessageBox.success(oThis.getResourceBundle().getText("msgSuccessSave"), {
				            title: "Success",                                      
				            initialFocus: null                                   
				        });
				    	if (oThis._oViewFormSubmit) {
							oThis._oViewFormSubmit.close();
						}
				    },
				    error: function(e){
				    	sap.ui.core.BusyIndicator.hide();
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
		
			inputChange: function(oEvent){
				
				var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
				  maxFractionDigits: 2,
				  groupingEnabled: true,
				  groupingSeparator: ",",
				  decimalSeparator: "."
				});
				
				
				
				
				var qty = oEvent.getParameters().value;
				var sPath = oEvent.getSource().getBindingContext("mktlist").getPath();
				var material = this.getView().getModel("mktlist").getProperty(sPath);
				//var id = oEvent.getParameters().id.substring(27, 28);
				var sId = oEvent.getParameters().id;
				var id = sId.substring(sId.indexOf("qty")+3,sId.indexOf("qty")+4);
				
				var oThis = this;
				var sMsg = "";
				var bConverted = false;
				
				
				var matDay = material["Day" + id];
				
				matDay.Error = false;
				var regex = /^\d+([,|\.]\d{3})*([,|\.]\d{2})?$/;
				
				if (!regex.test(qty)) {
					sMsg = this.getResourceBundle().getText("msgErrNumber");
					sap.m.MessageBox.error(sMsg, {
				            title: "Error",                                      
				            initialFocus: null                                   
				        });
				    matDay.Error = true;
				    return;
				    
				}
				

				var orderqty = 0;
				if (matDay.UOM === material.OrderUnit) {
					orderqty = matDay.Quantity;
				}else{
					orderqty = (material.FactorToUOM > 0) ? matDay.Quantity / material.FactorToUOM : 0;
					bConverted = true;
					sMsg =  this.getResourceBundle().getText("msgConvertedOrder",[oNumberFormat.format(orderqty),material.OrderUnit]) + "\n\r\n\r ";
					sMsg = sMsg + this.getResourceBundle().getText("msgUnitConversion",[oNumberFormat.format(material.FactorToUOM),matDay.UOM,material.OrderUnit]) + "\n\r";
				}
						
			
				if (orderqty > 0 && orderqty < material.MinOrder) {
					//if (bConverted) {
					//	sMsg = sMsg + this.getResourceBundle().getText("msgConvertedOrder",[oNumberFormat.format(orderqty),material.OrderUnit]) + "\n\r\n\r ";
					//}
					sMsg = sMsg + this.getResourceBundle().getText("msgMinOrder",[oNumberFormat.format(orderqty),oNumberFormat.format(material.MinOrder)]);
					sap.m.MessageBox.error(sMsg, {
				            title: "Error",                                      
				            initialFocus: null,
				            onClose: function(){
				            
				            }
				    });
					matDay.Error = true;
					return;						
				}
				if (!material.AllowDec) {
					if (orderqty % 1 !== 0) {
						
						//if (bConverted) {
						//	sMsg = sMsg + this.getResourceBundle().getText("msgConvertedOrder",[oNumberFormat.format(orderqty),material.OrderUnit]) + "\n\r\n\r ";
						//}
					    sMsg = sMsg +  this.getResourceBundle().getText("msgOrderAsWhole",[oNumberFormat.format(orderqty)]);
						sap.m.MessageBox.error(sMsg, {
				            title: "Error",                                      
				            initialFocus: null,
				            onClose: function(){
				            
				            }
				        });
				        matDay.Error = true;
				        return;
					}
					
				} 
				
			/*	var itemCost = matDay.Quantity * material.UnitPrice / material.PriceUnit;
				if(itemCost > this.oLocalData.MaxItemCost){
					sMsg = sMsg +  this.getResourceBundle().getText("msgMaxItemCost",[oNumberFormat.format(itemCost),oNumberFormat.format(this.oLocalData.MaxItemCost)]);
					sap.m.MessageBox.error(sMsg, {
				            title: "Error",                                      
				            initialFocus: null,
				            onClose: function(){
				            
				            }
				        });
				        matDay.Error = true;
				        return;
				}*/
					
				if (bConverted) {
				sap.m.MessageBox.information(sMsg, {
				          title: "Information",                                      
				          initialFocus: null,
				          onClose: function(){
				    		    oThis.inputWarning(matDay,material); 
				          }
				 });
				} else {
				
					this.inputWarning(matDay,material);
				}
				
				this.globalData.tableChanged = true;
			},
			inputWarning: function(matDay,material){
				var msg = "";
				if (matDay.Quantity > 500) {
					msg = this.getResourceBundle().getText("msgMoreThen",[500]);
					
				}
				var price = matDay.Quantity * material.UnitPrice / material.PriceUnit;
				if (price > 1000){
					msg = msg + "\n\r" + this.getResourceBundle().getText("msgCostMore",[material.Currency,1000]);
				}
				
				if (msg) {
					sap.m.MessageToast.show(msg);
				}
			},
			addCommentPress: function(oEvent){
				var oSource = oEvent.getSource();
				var text = oSource.data("myText");
				var sId = oSource.data("myId");
				//var enabled = oSource.data("Enabled");
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
				        /*new sap.m.Button({
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
				        }),*/
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
			
			onDeleteRow: function(oEvent){
				var oSource = oEvent.getSource();
				var sId = oSource.data("myId");
				var itemId = sId.substr(0,sId.length - 3);
				var itemIdx = parseInt(sId.slice(-2));
				var isNew = oSource.data("myNew");
				var key;
				var tableRows = this._oJsonModel.getData().rows;
				
				if (isNew){
						for (key in tableRows){
						if (tableRows[key].MaterialID === itemId) {
							tableRows.splice(key,1);
							this._oJsonModel.refresh();
							break;
						}
					}
				
				} else{
					for(key in tableRows) {
						if (tableRows[key].MaterialID === itemId){
							tableRows[key]["Day" + itemIdx].Enabled = !(tableRows[key]["Day" + itemIdx].Enabled);
							tableRows[key]["Day" + itemIdx].Deleted = !(tableRows[key]["Day" + itemIdx].Deleted);
							this._oJsonModel.refresh();
							this.globalData.tableChanged = true;
							break;
						}
					}
				}
			},
		/*	deleteRow: function(oEvent){
				var oItem = oEvent.getParameter("listItem");
				var sPath = oItem.getBindingContext("mktlist").getPath();
				var material = oItem.getModel("mktlist").getProperty(sPath);
				
				
				if (material.hasOwnProperty("New")){
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
				
			},*/
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
					this._oHPopover = sap.ui.xmlfragment("mm","sap.ui.demo.masterdetail.view.headerPopOver", this);
				
					this.getView().addDependent(this._oHPopover);
				}
				sap.ui.getCore().byId("mm--btnInfoDialog").setText("Close");
				this._oHPopover.openBy(oEvent.getSource());
			},
			closeInfoDialog: function(){
				if (this._oHPopover) {
					var oViewModel = this.getModel("detailView");
					var oTableH = this.getView().getModel("TableH");
					oTableH.setProperty("/PRTXT" + oViewModel.getProperty("/PurReqIdx"),oViewModel.getProperty("/PurReqComment"));
					this._oHPopover.close();
				}
			},
			onPRCommentChange : function() {
				if(sap.ui.getCore().byId("mm--btnInfoDialog").getText() === "Close") {
					sap.ui.getCore().byId("mm--btnInfoDialog").setText("Update/Close");
				}
			},
			onAddMaterial : function(){
				if (this.oLocalData) {
					this.getRouter().navTo("masterpage", {plantId : this.oLocalData.PlantID, ccId : this.oLocalData.CostCenterID}, false);
				}
			
			},
			onSearch: function(oEvent){
				var oList = this.byId("LDay" + this.globalData.dayId);
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
			onExit: function() {
				sap.ui.getCore().getEventBus().unsubscribe("marketlist","addMaterial",this._addMaterial,this);
				if (this._oMaterialDialog) {
					this._oMaterialDialog.destroy();
				}
			}

	});

});