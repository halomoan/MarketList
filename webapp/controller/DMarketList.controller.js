/*global location */
sap.ui.define([
		"sap/ui/demo/masterdetail/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/demo/masterdetail/model/formatter"
	], function (BaseController, JSONModel, formatter) {
		"use strict";

		return BaseController.extend("sap.ui.demo.masterdetail.controller.DMarketList", {
			formatter: formatter,
			
			onInit : function () {
			    
			    sap.ui.getCore().getEventBus().subscribe("marketlist","addMaterial",this._addMaterial,this);
			    
			    //var oDate = new Date();
			    var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "YYYY-MM-dd" });   
			    
			     
			    this.globalData = {
			    	iRefresh : 0,
			    	tableChanged : false,
			    	MarketListHeaderID : "MKT0001",
			    	PurchasingGroup : "037",
			    	MarketListDetailID : "MKD0001",
			    	noOfDay : 1
			    	
			    };
			    
			   
			    
				var oViewData = {
					toogleFreeze : false,
					freezeCold : 4,
					freezeColm : 1,
					columns : [
							{"noItem": 0 , "total" : 0, "visible": true},
							{"noItem": 0 , "total" : 0, "visible": false},
							{"noItem": 0 , "total" : 0, "visible": false},
							{"noItem": 0 , "total" : 0, "visible": false},
							{"noItem": 0 , "total" : 0, "visible": false},
							{"noItem": 0 , "total" : 0, "visible": false},
							{"noItem": 0 , "total" : 0, "visible": false},
							{"noItem": 0 , "total" : 0, "visible": true},
							{"noItem": 0 , "total" : 0, "visible": true},
							{"noItem": 0 , "total" : 0, "visible": true},
							{"noItem": 0 , "total" : 0, "visible": true},
							{"noItem": 0 , "total" : 0, "visible": true},
							{"noItem": 0 , "total" : 0, "visible": true},
							{"noItem": 0 , "total" : 0, "visible": true}
						],
					Date: dateFormat.format(new Date()),
					PlantID: "",
					Plant: "",
					CostCenterID : "",
					CostCenterText: "",
					UnloadingPoint: "",
					UserId : "",
					Recipient: "",
					TrackingNo : ""
				};
				
				var aSelectionItems = [];
				var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage();
				var sDay = this.getResourceBundle().getText("day");
				
				for(var i = 1; i <= 7; i++) {
					if (sCurrentLocale.startsWith("en")){
						var sShowDay = (i > 1) ? sDay + "s": sDay;
					}
					aSelectionItems.push({key: (i + "Day"), text: this.getResourceBundle().getText(i) + " " +  sShowDay});
				}
				
				oViewData.noOfDays = aSelectionItems;

				var oViewModel = new JSONModel(oViewData);
				this.setModel(oViewModel, "detailView");
				
				
				this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
				
				
				
			},
			_onMasterMatched :  function(oEvent) {
				if (this.globalData.iRefresh === 0) {
					//console.log(oEvent.getParameter("arguments"));
					//this.globalData.MarketListHeaderID = oEvent.getParameter("arguments").marketlistID;
					this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
				}
			},
			onExit:function(){
				
				sap.ui.getCore().getEventBus().unsubscribe("marketlist","addMaterial",this._addMaterial,this);
			},
			
			toggleFreeze: function(){
				
				var oViewModel = this.getModel("detailView"),
				    toogleFreeze = oViewModel.getProperty("/toogleFreeze");
				var freezeCol;
				 
				if(!sap.ui.Device.system.phone) {   
				    freezeCol =  oViewModel.getProperty("/freezeColm");
				} else {
				 	freezeCol =  oViewModel.getProperty("/freezeCold");
				}
				if(toogleFreeze){
					this.byId("mktlistTable").setFixedColumnCount(freezeCol);   
				} else{
					this.byId("mktlistTable").setFixedColumnCount(0);
					 oViewModel.setProperty("/freezeCol",4);
				}   
				
			},
			
			addCommentPress: function(oEvent){
				var text = oEvent.getSource().data("myText");
				var sId = oEvent.getSource().data("myId");
				var sComment = oEvent.getSource().data("myComment");
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
						beginButton: new sap.m.Button({
							text:  this.getResourceBundle().getText("submit"),
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
				var oTableH = this.getView().getModel("TableH").getData();
				
				
				var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
				var oLocalData = oStorage.get("localStorage");
				
				oLocalData.Recipient = oViewModel.getProperty("/Recipient");
				oLocalData.TrackingNo = oViewModel.getProperty("/TrackingNo");
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

				oHeaderD.Date0 = oTableH.Date0;
				oHeaderD.PRID0 = oTableH.PRID0;
				oHeader.TableH = oHeaderD;
				
				oHeaderD.Date1 =  oTableH.Date1;
				oHeaderD.PRID1 = oTableH.PRID1;
				oHeader.TableH = oHeaderD;
			                                               
				oHeaderD.Date2 =  oTableH.Date2;
				oHeaderD.PRID2 = oTableH.PRID2;
				oHeader.TableH = oHeaderD;
			
				oHeaderD.Date3 =  oTableH.Date3;
				oHeaderD.PRID3 = oTableH.PRID3;
				oHeader.TableH = oHeaderD;

				oHeaderD.Date4 =  oTableH.Date4;
				oHeaderD.PRID4 = oTableH.PRID4;
				oHeader.TableH = oHeaderD;
			
				oHeaderD.Date5 =  oTableH.Date5;
				oHeaderD.PRID5 = oTableH.PRID5;
				oHeader.TableH = oHeaderD;
			
				oHeaderD.Date6 =  oTableH.Date6;
				oHeaderD.PRID6 = oTableH.PRID6;
				oHeader.TableH = oHeaderD;
			
				oHeader.NavDetail = {};
				oHeader.NavDetail.results = [];
			
			
				for(var i in tableRows){
					var oDetail = {};
					oDetail.MarketListDetailID = oLocalData.MarketListDetailID ?  oLocalData.MarketListDetailID : this.globalData.MarketListDetailID ;
					oDetail.MarketListHeaderID = oLocalData.MarketListHeaderID ? oLocalData.MarketListHeaderID : this.globalData.MarketListHeaderID ;
					oDetail.MaterialGroupID = tableRows[i].MaterialGroupID;
					oDetail.MaterialID = tableRows[i].MaterialID;
					oDetail.MaterialText = "";
					oDetail.UnitPrice = tableRows[i].UnitPrice;
					oDetail.Currency = tableRows[i].Currency;
					oDetail.PriceUnit = tableRows[i].PriceUnit;
					
					
					
					oDetail.Day0 = tableRows[i].Day0;
					
					oDetail.Day1 = tableRows[i].Day1;
					
					oDetail.Day2 = tableRows[i].Day2;
					
					oDetail.Day3 = tableRows[i].Day3;
					
					oDetail.Day4 = tableRows[i].Day4;
					
					oDetail.Day5 = tableRows[i].Day5;
					
					oDetail.Day6 = tableRows[i].Day6;
					
					oHeader.NavDetail.results.push(oDetail);
				}
				
				console.log(oHeader);
				
				oModel.create("/MarketListHeaderSet", oHeader, {
			    	method: "POST",
				    success: function(data) {
				     alert("success");
				    },
				    error: function(e) {
				     alert("error");
				    }
			   });
			   	
				
			},
			closeSaveDialog: function() {
				if (this._oViewFormSubmit) {
					this._oViewFormSubmit.close();
				}
			},
			onClose: function(){
				var oThis = this;
				
				if (this.globalData.tableChanged === true) {
					sap.m.MessageBox.confirm(this.getResourceBundle().getText("msgConfirmUnsavedClose"),{
							icon: sap.m.MessageBox.Icon.INFORMATION,
							title: this.getResourceBundle().getText("confirm"),
							actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
							onClose: function(oAction){
								if (oAction === sap.m.MessageBox.Action.YES) {
									oThis.globalData.tableChanged = false;
									sap.ui.getCore().byId("__component0---app--idAppControl").hideMaster();
									oThis.getRouter().navTo("home", null, false);
									
								}
							}
						});
				} else{
					this.globalData.tableChanged = false;
					sap.ui.getCore().byId("__component0---app--idAppControl").hideMaster();
					this.getRouter().navTo("home", null, false);
					
				}
			
			},
			onRowsDelete: function() {
					var oThis = this;
					
					
					if (oThis.byId("mktlistTable").getSelectedIndex() >= 0) {
						sap.m.MessageBox.confirm(oThis.getResourceBundle().getText("confirmDelMaterial"),{
							icon: sap.m.MessageBox.Icon.INFORMATION,
							title: oThis.getResourceBundle().getText("confirm"),
							actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
							onClose: function(oAction){
								if (oAction === sap.m.MessageBox.Action.YES) {
									oThis._deleteRows(oThis);	
								}
							}
						});
					} else{
						sap.m.MessageBox.error(oThis.getResourceBundle().getText("noSelection"), {
						    title: oThis.getResourceBundle().getText("warning"),                                     
						    onClose: null,                                       
						    styleClass: "",                                       
						    initialFocus: null,                                  
						    textDirection: sap.ui.core.TextDirection.Inherit     
						});
					}
			},
			
			_deleteRows : function(oThis) {
				var oTable = oThis.byId("mktlistTable");
				var iCount = 0;
				var tableRows = oThis._oJsonModel.getData().rows;
				
				var aIndices = oTable.getSelectedIndices();
				
				for (var i = aIndices.length - 1; i >=0; i--){
					tableRows.splice(aIndices[i],1);
					iCount++;
				}
				
				
				if(iCount > 0) {
					oTable.clearSelection();
					oThis._oJsonModel.refresh();
				}
				this.globalData.tableChanged = true;
				
				
			},
			
			onNoOfDaysChange : function(oEvent) {
				
				var keyItem;
				if(oEvent) {
					keyItem = oEvent.getParameter("selectedItem").getKey();
				}
				var iCols = 0;
				var oViewModel = this.getModel("detailView");
				
				
				switch (keyItem){
					case "1Day": iCols = 0; this.globalData.noOfDay = 1; break;
					case "2Day": iCols = 1; this.globalData.noOfDay = 2; break;
					case "3Day": iCols = 2; this.globalData.noOfDay = 3; break;
					case "4Day": iCols = 3; this.globalData.noOfDay = 4; break;
					case "5Day": iCols = 4; this.globalData.noOfDay = 5; break;	
					case "6Day": iCols = 5; this.globalData.noOfDay = 6; break;
					case "7Day": iCols = 6; this.globalData.noOfDay = 7; break;
					default:  iCols = 0; this.globalData.noOfDay = 1; break; 
				}
				
				//Current & Past Days
				/*for (var i = 7; i <= 13; i++){
					if (i > (iCols - 7)) {
						oViewModel.setProperty("/columns/" + i + "/visible",false);	
					} else{
						oViewModel.setProperty("/columns/" + i + "/visible",true);	
					}
					
				}*/
				
				
				//Future Days
				for (var i = 0; i <= 6; i++){
					if (i > iCols ) {
						oViewModel.setProperty("/columns/" + i + "/visible",false);	
					} else{
						oViewModel.setProperty("/columns/" + i + "/visible",true);		
					}
					
				}
			
			},
			
			_onTableChanged : function(oModelJson) {
				
					var data = oModelJson.getProperty("/rows");
					
					
					//if (data && this.globalData.tableChanged) {
					if(data) {
					
						
						
						var noItems = [], totals = [];
						
						for (var key in data) {
							for (var prop in data[key]){
								if(prop.substring(0,3) === "Day") {
									
									var oDay = data[key][prop];
									
									if (oDay.Quantity > 0) {
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
						
						
						var i = 0;
						for (key in noItems) {
							oViewModel.setProperty("/columns/" + (i++) + "/noItem",noItems[key]);
							
						}
						
						i = 0;	
						for (key in totals) {
							oViewModel.setProperty("/columns/" + (i++) + "/total",formatter.currencyValue(totals[key]));
						}
					}
					
					if(this.globalData.iRefresh++ > 0) {
						this.globalData.tableChanged = true;
					}
			
			},
			_onMetadataLoaded: function(){
			
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "YYYYMMdd" }); 
				var oTable = this.byId("mktlistTable");
				var oViewModel = this.getModel("detailView");
				var oModelJson = new JSONModel();
				var oModelHeader = new JSONModel();
				var oView = this.getView();
				var oThis = this;
				
				var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
				var oLocalData = oStorage.get("localStorage");
				
				if (oLocalData) {
					
					oViewModel.setProperty("/PlantID",oLocalData.PlantID);
					oViewModel.setProperty("/Plant",oLocalData.Plant);
					oViewModel.setProperty("/CostCenterID",oLocalData.CostCenterID);
					oViewModel.setProperty("/CostCenterText",oLocalData.CostCenter);
					oViewModel.setProperty("/UnloadingPoint",oLocalData.UnloadingPoint);
					oViewModel.setProperty("/UserId",oLocalData.UserId);
				}
			    
				
				var oModel = this.getOwnerComponent().getModel();
				
				
				//var sPath = "/" + oModel.createKey("MarketListHeaderSet",{MarketListHeaderID:  this.globalData.MarketListID});
				//var sPath = "/" + oModel.createKey("MarketListHeaderSet");
				
				//var sPath = "/MarketListHeaderSet"; 
				
				
				var oFilters = [];
				oFilters.push( new sap.ui.model.Filter("PlantID", sap.ui.model.FilterOperator.EQ, oLocalData.PlantID) );
				oFilters.push( new sap.ui.model.Filter("CostCenterID", sap.ui.model.FilterOperator.EQ, oLocalData.CostCenterID) );
				oFilters.push( new sap.ui.model.Filter("UnloadingPoint", sap.ui.model.FilterOperator.EQ, oLocalData.UnloadingPoint) );
				//oFilters.push( new sap.ui.model.Filter("Date", sap.ui.model.FilterOperator.EQ, dateFormat.format(new Date())));
				oFilters.push( new sap.ui.model.Filter("Date", sap.ui.model.FilterOperator.EQ, "20180622"));
				
				sap.ui.core.BusyIndicator.show();
				oModel.read("/MarketListHeaderSet", {
				    urlParameters: {
				        "$expand": "NavDetail"
				    },
				    filters: oFilters,
				    success: function(rData) {
				    	
				    	var oHeader = rData.results[0];
				    	
				    	oModelHeader.setData(oHeader.TableH);
				    	oThis.getView().setModel(oModelHeader,"TableH");
				    	
				    	var oDetail = oHeader.NavDetail.results;
				    	oModelJson.setData({ rows : oDetail } );
					    oView.setModel(oModelJson,"mktlist");
					    oTable.bindRows("mktlist>/rows");
				    	sap.ui.core.BusyIndicator.hide();
				    },
				    error: function(oError) {
			            sap.ui.core.BusyIndicator.hide();
			        }
				});

			/*	this.getView().bindElement({
					path: "/MarketListHeaderSet",
					parameters: {
						expand: "NavDetail"
					},
					events: {
                        dataReceived: function(rData){
                            sap.ui.core.BusyIndicator.hide();
                            
                            var oData = rData.getParameter("data");
                            if(oData){
                            	
                            	console.log(oData);
                            	
                            	oThis.globalData.MarketListID = oData.MarketListHeaderID;
                            	oThis.globalData.Dates[0] = oData.TableH.Date0;
						      	oThis.globalData.Dates[1] = oData.TableH.Date1;
						      	oThis.globalData.Dates[2] = oData.TableH.Date2;
						      	oThis.globalData.Dates[3] = oData.TableH.Date3;
						      	oThis.globalData.Dates[4] = oData.TableH.Date4;
						      	oThis.globalData.Dates[5] = oData.TableH.Date5;
						      	oThis.globalData.Dates[6] = oData.TableH.Date6;
						      	oThis.globalData.Dates[7] = oData.TableH.Date7;
						      	oThis.globalData.Dates[8] = oData.TableH.Date8;
						      	oThis.globalData.Dates[9] = oData.TableH.Date9;
						      	oThis.globalData.Dates[10] = oData.TableH.Date10;
						      	oThis.globalData.Dates[11] = oData.TableH.Date11;
						      	oThis.globalData.Dates[12] = oData.TableH.Date12;
						      	oThis.globalData.Dates[13] = oData.TableH.Date13;
						      	
						      	oThis.globalData.PRID[0] = oData.TableH.PRID0;
						      	oThis.globalData.PRID[1] = oData.TableH.PRID1;
						      	oThis.globalData.PRID[2] = oData.TableH.PRID2;
						      	oThis.globalData.PRID[3] = oData.TableH.PRID3;
						      	oThis.globalData.PRID[4] = oData.TableH.PRID4;
						      	oThis.globalData.PRID[5] = oData.TableH.PRID5;
						      	oThis.globalData.PRID[6] = oData.TableH.PRID6;
						      	oThis.globalData.PRID[7] = oData.TableH.PRID7;
						      	oThis.globalData.PRID[8] = oData.TableH.PRID8;
						      	oThis.globalData.PRID[9] = oData.TableH.PRID9;
						      	oThis.globalData.PRID[10] = oData.TableH.PRID10;
						      	oThis.globalData.PRID[11] = oData.TableH.PRID11;
						      	oThis.globalData.PRID[12] = oData.TableH.PRID12;
						      	oThis.globalData.PRID[13] = oData.TableH.PRID13;
						      	
					      	
                            }
                        },
                      dataRequested: function(){
                      	sap.ui.core.BusyIndicator.show();
                      }
					}    
				});
				
				/*
				sap.ui.core.BusyIndicator.show();
				oModel.read(sPath + "/MarketListDetailSet", {
				    method: "GET",
				    success: function(oData) {
				    	
				    	if (oData.results) {
					    	oModelJson.setData({ rows : oData.results } );
					    	oView.setModel(oModelJson,"mktlist");
					      	oTable.bindRows("mktlist>/rows");	
					      	var oItem = oData.results[0];
					      	
					      	
					      	
					      	oThis.globalData.Dates[0] = oItem.Day0.Date;
					      	oThis.globalData.Dates[1] = oItem.Day1.Date;
					      	oThis.globalData.Dates[2] = oItem.Day2.Date;
					      	oThis.globalData.Dates[3] = oItem.Day3.Date;
					      	oThis.globalData.Dates[4] = oItem.Day4.Date;
					      	oThis.globalData.Dates[5] = oItem.Day5.Date;
					      	oThis.globalData.Dates[6] = oItem.Day6.Date;
					      	oThis.globalData.Dates[7] = oItem.Day7.Date;
					      	oThis.globalData.Dates[8] = oItem.Day8.Date;
					      	oThis.globalData.Dates[9] = oItem.Day9.Date;
					      	oThis.globalData.Dates[10] = oItem.Day10.Date;
					      	oThis.globalData.Dates[11] = oItem.Day11.Date;
					      	oThis.globalData.Dates[12] = oItem.Day12.Date;
					      	oThis.globalData.Dates[13] = oItem.Day13.Date;
					      	
					      	
					      	oThis.globalData.PRID[0] =  oItem.Day0.PRID;
					      	oThis.globalData.PRID[1] =  oItem.Day1.PRID;
					      	oThis.globalData.PRID[2] =  oItem.Day2.PRID;
					      	oThis.globalData.PRID[3] =  oItem.Day3.PRID;
					      	oThis.globalData.PRID[4] =  oItem.Day4.PRID;
					      	oThis.globalData.PRID[5] =  oItem.Day5.PRID;
					      	oThis.globalData.PRID[6] =  oItem.Day6.PRID;
					      	oThis.globalData.PRID[7] =  oItem.Day7.PRID;
					      	oThis.globalData.PRID[8] =  oItem.Day8.PRID;
					      	oThis.globalData.PRID[9] =  oItem.Day9.PRID;
					      	oThis.globalData.PRID[10] =  oItem.Day10.PRID;
					      	oThis.globalData.PRID[11] =  oItem.Day11.PRID;
					      	oThis.globalData.PRID[12] =  oItem.Day12.PRID;
					      	oThis.globalData.PRID[13] =  oItem.Day13.PRID;
					      	
					      	
					      	
					      	oViewModel.setProperty("/columns/0/date",oThis.globalData.Dates[0]);
					      	oViewModel.setProperty("/columns/1/date",oThis.globalData.Dates[1]);
					      	oViewModel.setProperty("/columns/2/date",oThis.globalData.Dates[2]);
					      	oViewModel.setProperty("/columns/3/date",oThis.globalData.Dates[3]);
					      	oViewModel.setProperty("/columns/4/date",oThis.globalData.Dates[4]);
					      	oViewModel.setProperty("/columns/5/date",oThis.globalData.Dates[5]);
					      	oViewModel.setProperty("/columns/6/date",oThis.globalData.Dates[6]);
					      	oViewModel.setProperty("/columns/7/date",oThis.globalData.Dates[7]);
					      	oViewModel.setProperty("/columns/8/date",oThis.globalData.Dates[8]);
					      	oViewModel.setProperty("/columns/9/date",oThis.globalData.Dates[9]);
					      	oViewModel.setProperty("/columns/10/date",oThis.globalData.Dates[10]);
					      	oViewModel.setProperty("/columns/11/date",oThis.globalData.Dates[11]);
					      	oViewModel.setProperty("/columns/12/date",oThis.globalData.Dates[12]);
					      	oViewModel.setProperty("/columns/13/date",oThis.globalData.Dates[13]);
					      	
					      	
					      	
				    	}
				    
				      
						
						sap.ui.core.BusyIndicator.hide();	
				    },
				    error: function() {
						sap.ui.core.BusyIndicator.hide();
				    }
				});
				
				*/
				
			
				if (!oModelJson.getData().rows) {
					oModelJson.setData({ rows : [] } );
					oView.setModel(oModelJson,"mktlist");
					oTable.bindRows("mktlist>/rows");	
					
				}
				
				var binding =  new sap.ui.model.Binding(oModelJson, "/rows", oModelJson.getContext("/rows"));
				binding.attachChange(function() {
						this._onTableChanged(oModelJson);
						
				}.bind(this));
				
				this._oJsonModel = oModelJson;
			
			
			},
			
			_addMaterial: function(sChannel,sEvent,oData){
				
				
				if (oData ) {
					
					
					var oTableH = this.getView().getModel("TableH").getData();
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
							
							oData.data[i].MarketListHeaderID =  this.globalData.MarketListID;
							oData.data[i].MarketListDetailID = "MKD0001";
							
							tableRows.push(oData.data[i]);
							
						
							
							bAdded = true;
						} else {
							sap.m.MessageToast.show(oData.data[i].MaterialID + " - " + oData.data[i].MaterialText + " is already in the table.",{});	
						}
					}
					
					if (bAdded) {
						this.globalData.tableChanged = true;
						this._oJsonModel.refresh();
						//sap.ui.getCore().byId("__component0---app--idAppControl").hideMaster();
					}
					
					
					
					
				}
			}
			
	});
});