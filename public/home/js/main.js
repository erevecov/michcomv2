let clientsTable; // Tabla clientes
let selectedClient; // Objeto que contiene los datos del cliente seleccionado;
let selectedClientRow; // ROW Actual seleccionada de clientsTable
let invoicesReport = {rows:[]}; // Objeto que contiene la información del reporte de facturas pendientes de un cliente


const formatClients = () => {
    return new Promise(resolve =>{
        ajax({url: 'api/clients'}).then(data=>{
            let clients = data.map((client, index) => {
                let owedStatus;
    
                if(client.amountOwed === 0) {
                     owedStatus = 'SIN DEUDAS'; 
                } else {
                     owedStatus = 'PENDIENTE';
                }
    
                client.rut = $.formatRut(client._id);
                client.owedStatus = owedStatus;
                client.invoiceOwed = client.invoiceOwed.reduce((final, actual) => final += actual+' - ','').slice(0, -3);
                client.amountOwed = `$ ${number_format(client.amountOwed)}`; 
    
                delete client.status;
                delete client._id;
                delete client.type;
                
                return client;
            });
    
            return clients;
        }).then((clients) =>{
            resolve(clients);
        });
    });
};

const chargeNewInvoiceForm =() => {
    $('#new').html(`
    <div class="card bg-light mb-3" >
        <div class="card-header text-center">
            <h2>INGRESAR NUEVA FACTURA AL SISTEMA<h2>
        </div>
        <div class="card-body row">
            <div class="col-md-4">
                <div class="form-group">
                    <label class="col-md-12 control-label"><i class="fa fa-asterisk" aria-hidden="true"></i> Número de factura</label>  
                    <div class="col-md-12 inputGroupContainer">
                    <div class="input-group">
                    <input id="newInvoiceNumber" placeholder="N° de factura" class="form-control" type="number" min="1">
                    </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="form-group">
                    <label class="col-md-12 control-label" ><i class="fa fa-usd" aria-hidden="true"></i> Monto</label> 
                    <div class="col-md-12 inputGroupContainer">
                    <div class="input-group">
                    <input id="newInvoiceAmount" placeholder="Monto de la factura" class="form-control" type="number" min="1">
                    </div>
                    </div>
                </div>
            </div>

            <div class="col-md-4">                      
                <div class="form-group"> 
                    <label class="col-md-12 control-label"><i class="fa fa-list" aria-hidden="true"></i> Tipo de factura</label>
                    <div class="col-md-12 selectContainer">
                        <div class="input-group">
                        <select id="newInvoiceType" class="form-control selectpicker" >
                            <option selected value="product">Producto</option>
                            <option value="service">Servicio</option>
                        </select>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="form-group"> 
                    <label class="col-md-12 control-label"><i class="fa fa-list" aria-hidden="true"></i> Razón social</label>
                    <div class="col-md-12 selectContainer">
                    <div class="input-group">
                        <select style="background:#ecf0f1;" id="newInvoiceBusiness" class="form-control selectpicker" disabled >
                            <option selected value="Michcom Ltda">Michcom Ltda</option>
                            <option value="Tronit Ltda">Tronit Ltda</option>
                        </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-4">   
                <div class="form-group">
                    <label class="col-md-12 control-label"><i class="fa fa-pencil" aria-hidden="true"></i> Descripción</label>
                    <div class="col-md-12 inputGroupContainer">
                    <div class="input-group">
                    <textarea class="form-control" id="newInvoiceDescription" placeholder="Descripción de la factura"></textarea>
                        </div>
                    </div>
                </div>
            </div>
            
                            
            <div class="col-md-4"> 
                <!-- Button -->
                <div class="form-group">
                    <label class="col-md-12 control-label"></label>
                    <div class="col-md-12">
                    <button id="sendNewInvoice" class="btn btn-primary btn-lg btn-block" >AGREGAR NUEVA FACTURA <span><i class="fa fa-paper-plane" aria-hidden="true"></i></span></button>
                    </div>
                </div>
            </div>

            <div style="display: none;" id="form_messages"></div>  
        </div>
    </div>
	`);	
};

const chargeInvoiceTable = (client) => { // TODO: HACER ESTE
	let invoicesData = [];
	let totalClientPaidCount = 0; // Contador de facturas pagadas
	let totalClientOwedCount = 0; // Contador de facturas adeudadas
	let totalClientPaid = 0; // Monto total de las facturas pagadas por el cliente
    let totalClientOwed = 0; // Monto total de las facturas que debe el cliente
    let infoContent; // Contiene todo el html de infoContent

    invoicesData = client.invoices.map(invoice =>{
        if(invoice.status === 'PENDIENTE') {
            totalClientOwed += invoice.amount;
        } else if (invoice.status === 'PAGADO') {
            totalClientPaid += invoice.amount;
        }

        return {
			invoice: invoice.invoice,
			date: invoice.date,
			amount: '$ '+number_format(invoice.amount),
			description: invoice.description,
			status: invoice.status,
			business: invoice.business,
            iva: '$ '+number_format(invoice.iva),
            creationDate: invoice._id
		};
    });

	$('#invoices').empty();
    $('#invoices').html(`
    <div class="card bg-light mb-3">
        <div class="card-header text-center"><h2>FACTURAS</h2></div>
        <div class="card-body">
            <table id="invoiceTable" class="display nowrap table table-condensed" cellspacing="0">
                <thead>
                    <tr>
                        <th>N° Factura:</th>
                        <th>Fecha:</th>
                        <th>Monto:</th>
                        <th>Descripción:</th>
                        <th>Empresa:</th>
                        <th>Estado:</th>
                        <th>Iva:</th>
                        <th>Fecha creación</th>
                    </tr>
                </thead>		 
            </table>
        </div>
    </div>   
    `);

	invoiceTable = $('#invoiceTable')
	.DataTable({
	  	"iDisplayLength": 100,
	  	"dom": 'Bfrtip',
		"buttons": [
		    {
                extend: 'pdfHtml5',
                customize: ( doc ) => {
                    doc.content.splice( 1, 0, {
                        margin: [ 0, 0, 0, 12 ],
                        alignment: 'center',
                        image: base64logo
                    } );
                }
		    }
        ],
	  	"oLanguage": {
			"sSearch": "Buscar "
		},
		"order": [[0, "desc"]],
	  	"responsive": true,
	    "aaData" : invoicesData,
	    "columns" : [
	        {"data" : "invoice"}, 
	    	{"data" : "date"},
	        {"data" : "amount"},  
	        {"data" : "description"},
	        {"data" : "business"}, 
	        {"data" : "status"},
            {"data" : "iva"},
            {"data" : "creationDate"},
		],
		"columnDefs": [
            {
                "targets": [ 6,7 ],
                "visible": false,
                "searchable": false
			}
        ],
		createdRow: (row, data, dataIndex) => {
			if( data.status == `PAGADO`){
				totalClientPaidCount++;
			    $(row).css('background', 'rgba(26, 188, 156,0.3)');
	        } else if (data.status == `PENDIENTE`) {
	      	    totalClientOwedCount++;
			    $(row).css('background', 'rgba(231, 76, 60,0.3)');
	        }
	    },
	    initComplete: (settings, json) => {
	 		$('div.dataTables_filter input').focus();
            chargeClientCharts({paid:totalClientPaidCount, owed:totalClientOwedCount});
	 		$('#clientPaid').text("$ " + number_format(totalClientPaid));
	 		$('#clientOwed').text("$ " + number_format(totalClientOwed));
	  	}
	          
    });

    invoiceTable.on( 'draw', function () { 
        var body = $( invoiceTable.table().body() );

        body.unhighlight();
        body.highlight( invoiceTable.search() );  
    });
      
	$('.dataTables_filter input').attr("placeholder", "Buscador");
	  
	$('#invoiceTable tbody').on('dblclick', 'tr', function () {
        statusDataRow = invoiceTable.row( $(this) ).data();
        console.log(statusDataRow)
      	statusSelectedRow = invoiceTable.row( $(this)  );
        invoiceNumberToChange = statusDataRow.invoice;
        
        if(statusDataRow.status === 'PENDIENTE') {
            getTime().then(data=>{
               let todayDate = moment(data).format('DD/MM/YYYY');

               $('#infoContent').css('display', 'none');
               $('#invoiceStep').html(`
                <div class="card bg-light mb-3" >
                    <div class="card-header text-center">
                        <a id="goBack" class="btn btn-default pull-left"><i class="fa fa-arrow-left" aria-hidden="true"></i></a><h2>INFORMACIÓN DE FACTURA <b>Nº${statusDataRow.invoice}</b><h2>
                    </div>
                    <div class="card-body row">
            
                        <div class="col-md-9">
                            <table class="table table-hover">
                                <tbody>
                                    <tr class="table-light">
                                        <th><h3>MONTO TOTAL<h3></th>
                                        <th><h2><b>${statusDataRow.amount}</b><h2></th>
                                    </tr>
                                    <tr class="table-light">
                                        <th><h3>IVA</h3></th>
                                        <th><h2><b>${statusDataRow.iva}</b></h2></th>
                                    </tr>
                                    <tr class="table-light">
                                        <th><h3>DESCRIPCIÓN<h3></th>
                                        <th><h2><b>${statusDataRow.description}</b></h2></th>
                                    </tr>
                                    <tr class="table-light">
                                        <th><h3>RAZÓN SOCIAL<h3></th>
                                        <th><h2><b>${statusDataRow.business}</b></h2></th>
                                    </tr>
                                    <tr class="table-light">
                                        <th><h3>FECHA DE CREACIÓN<h3></th>
                                        <th><h2><b>${moment(statusDataRow.creationDate).format('DD/MM/YYYY hh:mm')}</b></h2></th>
                                    </tr>
                                    <tr class="table-light">
                                        <th><h3>FECHA PAGO DE FACTURA<h3></th>
                                        <th><input style="font-size:30px; width:200px;" type="text" name="invoiceDate" value="${todayDate}" /></th>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="col-md-3">
                            <button id="modInvoice" class="btn btn-warning btn-lg btn-block"><i class="fa fa-pencil-square-o" aria-hidden="true"></i> Modificar Factura</button>
                            <br>	
                            <button id="delInvoice" class="btn btn-danger btn-lg btn-block"><i class="fa fa-times" aria-hidden="true"></i> Eliminar Factura</button>
                            <br>
                            <button id="sendStatus" class="btn btn-success btn-lg btn-block"><i class="fa fa-retweet" aria-hidden="true"></i> Cambiar estado a PAGADO</button>
                            <br>
                            <div id="loadingStatus"></div>
                        </div>
                    </div>
                </div>
               `);
 
               
               $('input[name="invoiceDate"]').daterangepicker({
                    "locale": {
                        "format": "DD/MM/YYYY",
                        "daysOfWeek": [
                            "Dom",
                            "Lun",
                            "Mar",
                            "Mie",
                            "Jue",
                            "Vie",
                            "Sab"
                        ],
                        "monthNames": [
                            "Enero",
                            "Febrero",
                            "Marzo",
                            "Abril",
                            "Mayo",
                            "Junio",
                            "Julio",
                            "Agosto",
                            "Septiembre",
                            "Octubre",
                            "Noviembre",
                            "Diciembre"
                        ],
                        "firstDay": 1
                    },
                    drops: "up",
                    singleDatePicker: true,
                    showDropdowns: true
                });
 
                $('input[name="invoiceDate"]').focus();
            });
		  	
			
	    }else if (statusDataRow.status === 'PAGADO') {
	    	$('#infoContent').css('visibility', 'hidden');
	    	$('#invoiceStep').html(`
	    		<a id="goBack" class="btn btn-default"><i class="fa fa-arrow-left" aria-hidden="true"></i></a>
				<a id="modInvoice" class="btn btn-warning pull-right"><i class="fa fa-pencil-square-o" aria-hidden="true"></i> Modificar Factura</a>
				<br>
				<a id="delInvoice" class="btn btn-danger pull-right"><i class="fa fa-times" aria-hidden="true"></i> Eliminar Factura</a>	
				
		  		<center>
		  		<h1>N° de factura: <b>${statusDataRow.invoice}</b></h1>
				<h1>Monto total: <b>${statusDataRow.amount}</b></h1>
		  		<h2>Iva: <b>${statusDataRow.iva}</b></h2>
		  		<h1>Descripción:</h1>
		  		<h2><b>${statusDataRow.description}</b></h2>
		  		<h1>Razón de anulación</h1> 
		  		<textarea class="form-control" rows="5" id="cancellation_reason"></textarea>
		  			<br>
		  			<button id="sendStatus" class="btn btn-danger btn-block"><h2> <i class="fa fa-retweet" aria-hidden="true"></i>  Cambiar estado a PENDIENTE</h2></button>
		  		</center>
		  	`);

	    }

	  });



	  $('#invoiceStep').on( 'click', '#goBack', function () {
	    $('#infoContent').css('display', 'inline');
	  	$('#invoiceStep').empty();
	  }); 

	  $('#invoiceStep').on( 'click', '#modInvoice', function () {
		  var beforeMod = $('#invoiceStep').html();
		  var filter1 = statusDataRow.amount.replace('$','');
		  var filter2 = filter1.split('.').join('');
		  var filter3 = parseInt(filter2);
		  var type = '';
		 
		  console.log(statusDataRow);
		  $('#invoiceStep').empty();
          $('#invoiceStep').html(`
            <div class="card bg-light mb-3" >
                <div class="card-header text-center">
                    <a id="goBack2" class="btn btn-default pull-left"><i class="fa fa-arrow-left" aria-hidden="true"></i></a> <h2>MODIFICAR FACTURA <b>${statusDataRow.invoice}</b><h2>
                </div>
                <div class="card-body row">
                    <div class="col-md-4">
                        <div class="form-group">
                            <label class="col-md-12 control-label"><i class="fa fa-asterisk" aria-hidden="true"></i> Número de factura</label>  
                            <div class="col-md-12 inputGroupContainer">
                                <div class="input-group">
                                    <input style="background:#ecf0f1;" disabled id="modInvoiceNumber" placeholder="N° de factura" class="form-control" type="number" min="1" value="${statusDataRow.invoice}">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="form-group">
                            <label class="col-md-12 control-label" ><i class="fa fa-usd" aria-hidden="true"></i> Monto</label> 
                            <div class="col-md-12 inputGroupContainer">
                                <div class="input-group">
                                    <input id="modInvoiceAmount" placeholder="Monto de la factura" class="form-control" type="number" min="1" value ="${filter3}">
                                </div>
                            </div>
                        </div>
                    </div>
        
                    <div class="col-md-4">                      
                        <div class="form-group"> 
                            <label class="col-md-12 control-label"><i class="fa fa-list" aria-hidden="true"></i> Tipo de factura</label>
                            <div class="col-md-12 selectContainer">
                                <div class="input-group">
                                    <select id="modInvoiceType" class="form-control selectpicker" >
                                        <option selected value="product">Producto</option>
                                        <option value="service">Servicio</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="form-group"> 
                            <label class="col-md-12 control-label"><i class="fa fa-list" aria-hidden="true"></i> Razón social</label>
                            <div class="col-md-12 selectContainer">
                                <div class="input-group">
                                    <select style="background:#ecf0f1;" id="modInvoiceBusiness" class="form-control selectpicker" disabled >
                                        <option selected value="Michcom Ltda">Michcom Ltda</option>
                                        <option value="Tronit Ltda">Tronit Ltda</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
        
                    <div class="col-md-4">   
                        <div class="form-group">
                            <label class="col-md-12 control-label"><i class="fa fa-pencil" aria-hidden="true"></i> Descripción</label>
                            <div class="col-md-12 inputGroupContainer">
                                <div class="input-group">
                                    <textarea class="form-control" id="modInvoiceDescription" placeholder="Descripción de la factura">${statusDataRow.description}</textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-4"> 
                        <!-- Button -->
                        <div class="form-group">
                        <label class="col-md-12 control-label"></label>
                        <div class="col-md-12">
                            <button id="sendModInvoice" class="btn btn-primary btn-lg btn-block" >Modificar <span><i class="fa fa-paper-plane" aria-hidden="true"></i></span></button>
                        </div>
                        </div>
                    </div> 
        
                    <div style="display: none;" id="form_messages"></div>  
                </div>
            </div>
		  `);

		  if(statusDataRow.business == 'Tronit Ltda') {
			$('#modInvoiceType').val('service');
			$('#modInvoiceBusiness').val('Tronit Ltda');
			console.log('servicio')
		  } else if (statusDataRow.business == 'Michcom Ltda') {
			$('#modInvoiceType').val('product');
			$('#modInvoiceBusiness').val('Michcom Ltda');
			console.log('producto')
		  }

		  $('#modInvoiceType').on('change', function(){
				if($('#modInvoiceType').val() === 'product') {
					$( "#modInvoiceBusiness" ).val('Michcom Ltda');
				}else if ($('#modInvoiceType').val() === 'service') {
					$( "#modInvoiceBusiness" ).val('Tronit Ltda');
				}
		   });

		   $('#goBack2').on('click', function() {
			$('#invoiceStep').html(beforeMod);
		   })














		$('#sendModInvoice').on('click', function() {
			var step = 0;
			var modInvoiceNumber = parseInt($('#modInvoiceNumber').val());
			var modInvoiceAmount = parseInt($('#modInvoiceAmount').val());
			var modInvoiceType = $('#modInvoiceType').val();
			var modInvoiceBusiness = $('#modInvoiceBusiness').val();
			var modInvoiceDescription = $('#modInvoiceDescription').val();
			var iva = parseInt(modInvoiceAmount * 0.19);

			if(modInvoiceType === 'service') {
				iva = 0;
			}

			if (modInvoiceNumber > 0 && Number.isInteger(modInvoiceNumber)) {
				$('#modInvoiceNumber').css('border', '1px solid green');
				step++;
			}else {
				$('#modInvoiceNumber').css('border', '1px solid red');
			}

			if (modInvoiceAmount > 0 && Number.isInteger(modInvoiceAmount)) {
				$('#modInvoiceAmount').css('border', '1px solid green');
				step++;
			}else {
				$('#modInvoiceAmount').css('border', '1px solid red');
			}

			if (modInvoiceDescription.length >= 5 && modInvoiceDescription.length <= 500) {
				$('#modInvoiceDescription').css('border', '1px solid green');
				step++;
			}else {
				$('#modInvoiceDescription').css('border', '1px solid red');
			}

			$('#modInvoiceType').css('border', '1px solid green');
			$('#modInvoiceBusiness').css('border', '1px solid green');


			if(step === 3) {
				
				$.ajax({
					url: 'api/modInvoice',
					type: 'POST',
					data: {rut: selectedClient.rut, invoice: modInvoiceNumber, business: modInvoiceBusiness, amount: modInvoiceAmount, invoice_type: modInvoiceType, description: modInvoiceDescription, iva: iva}
				})
				.done(function(data) {
					//console.log(data)
					getOweds();
					createLog2('Facturas', 'Se modificó la factura '+modInvoiceNumber+' del cliente '+selectedClient.rut+' ('+selectedClient.name+')');

					if (data.error) {
						$('#modalInvoiceNumber').css('border', '1px solid red');
						$('#form_messages').html('<div class="alert alert-danger"><center>'+data.error+'</center></div>');
						$('#form_messages').slideDown({ opacity: "show" }, "slow");
						$('#sendModInvoice').prop('disabled', false);
						
					}else if (data.ok) {
						$('#form_messages').html('<div class="alert alert-success"><center>'+data.ok+'</center></div>');
						$('#form_messages').slideDown({ opacity: "show" }, "slow");


						setTimeout(function() {
							$('#invoiceStep').empty();
							$('#infoContent').css('visibility', 'visible');
							statusSelectedRow.remove().draw();

							
							setTimeout(function() {
								var newRowAdded = invoiceTable.row.add( {
									"invoice": data.invoice.invoice,
									"date": data.invoice.date,
									"amount": '$ '+ number_format(data.invoice.amount),
									"description": data.invoice.description,
									"business": data.invoice.business,
									"status": data.invoice.status,
									"iva": '$ '+ number_format(data.invoice.iva)
								}).draw().node();

								$( newRowAdded ).css( 'color', '#f1c40f' );

								setTimeout(function(){
									$( newRowAdded ).css( 'color', '#333339' ) ;
								}, 1000);

								
								selectedClient.invoices.forEach(function(element, index) {
									
									if(element.invoice === modInvoiceNumber) {
										//console.log(element.invoice, modInvoiceNumber)
										selectedClient.invoices.splice(index,1)
									}
									

								}, this);
								

								selectedClient.invoices.push({
									amount: data.invoice.amount,
									business: data.invoice.business,
									date: data.invoice.date,
									description: data.invoice.description,
									invoice: data.invoice.invoice,
									invoice_type: data.invoice.invoice_type,
									status: data.invoice.status,
									_id: data.invoice._id
								});

								console.log(selectedClient);

								var filter1 = statusDataRow.amount.replace('$','');
								var filter2 = filter1.split('.').join('');
								var filter3 = parseInt(filter2);

								if ( data.invoice.status === 'PENDIENTE' ) {
									totalClientOwed = totalClientOwed - filter3;
									totalClientOwed += data.invoice.amount;
								} else if( data.invoice.status === 'PAGADO' ) {
									totalClientPaid = totalClientPaid - filter3;
									totalClientPaid += data.invoice.amount;
								}

								$('#clientOwed').text("$ " + number_format(totalClientOwed));
								$('#clientPaid').text("$ " + number_format(totalClientPaid));
								/* Falta solo esto
								totalClientOwed += newInvoiceAmount;

								reloadClientRow();

								$('#clientOwed').text("$ " + number_format(totalClientOwed));
								chargeClientCharts(totalClientPaidCount, totalClientOwedCount);
								*/	
							
							}, 500);

							
							/*
							// REINICIAR FORMULARIO 
							$('#modInvoiceNumber').val('');
							$('#modInvoiceNumber').css('border', '1px solid #CCCCCC');
							$('#modInvoiceAmount').val('');
							$('#modInvoiceAmount').css('border', '1px solid #CCCCCC');
							$('#modInvoiceType').css('border', '1px solid #CCCCCC');
							$('#modInvoiceDescription').val('');
							$('#modInvoiceDescription').css('border', '1px solid #CCCCCC');
							$('#sendModInvoice').prop('disabled', false);
							$('#form_messages').empty();
							*/

						}, 1000);
						

					}


					/*
					getOweds();
					createLog2('Facturas', 'Se modificó la factura '+modInvoiceNumber+' del cliente '+selectedClient.rut+' ('+selectedClient.name+')');
					totalOwed += newInvoiceAmount;
					$('#totalOwed').text('$ '+ number_format(totalOwed) );

					if (data.error) {
						$('#newInvoiceNumber').css('border', '1px solid red');
						$('#form_messages').html('<div class="alert alert-danger"><center>'+data.error+'</center></div>');
						$('#form_messages').slideDown({ opacity: "show" }, "slow");
						$('#sendNewInvoice').prop('disabled', false);
						
					}else if (data.ok) {
						$('#form_messages').html('<div class="alert alert-success"><center>'+data.ok+'</center></div>');
						$('#form_messages').slideDown({ opacity: "show" }, "slow");


						setTimeout(function() {
							$('.nav-tabs a[href="#info"]').tab('show');

							setTimeout(function() {
								var newRowAdded = invoiceTable.row.add( {
									"invoice": newInvoiceNumber,
									"date": '-',
									"amount": '$ '+ number_format(newInvoiceAmount),
									"description": newInvoiceDescription,
									"business": newInvoiceBusiness,
									"status": 'PENDIENTE',
									"iva": '$ '+ number_format(iva)
								}).draw().node();

								$( newRowAdded ).css( 'color', '#f1c40f' );

							setTimeout(function(){
								$( newRowAdded ).css( 'color', '#333339' ) ;
							}, 1000);

							console.log(selectedClient);

							selectedClient.invoices.push({
								amount: newInvoiceAmount,
								business: newInvoiceBusiness,
								date: '-',
								description: newInvoiceDescription,
								invoice: newInvoiceNumber,
								invoice_type: newInvoiceType,
								status: 'PENDIENTE',
								_id: data.id
							});

							totalClientOwed += newInvoiceAmount;
							reloadClientRow();

							$('#clientOwed').text("$ " + number_format(totalClientOwed));
							chargeClientCharts(totalClientPaidCount, totalClientOwedCount);


							}, 500);


							// REINICIAR FORMULARIO 
							$('#newInvoiceNumber').val('');
							$('#newInvoiceNumber').css('border', '1px solid #CCCCCC');
							$('#newInvoiceAmount').val('');
							$('#newInvoiceAmount').css('border', '1px solid #CCCCCC');
							$('#newInvoiceType').css('border', '1px solid #CCCCCC');
							$('#newInvoiceDescription').val('');
							$('#newInvoiceDescription').css('border', '1px solid #CCCCCC');
							$('#sendNewInvoice').prop('disabled', false);
							$('#form_messages').empty();


						}, 1000);
				

					}
					*/
				})
				.fail(function() {
					console.log("error al crear factura");
				});
				
				
			}

		});
	  }); 

	  $('#invoiceStep').on( 'click', '#delInvoice', function () { //TODO: BORRAR FACTURA
	  	swal({
            title: '¿Estás seguro de eliminar la factura '+statusDataRow.invoice+'?',
            text: '',
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Si, Eliminar!',
            cancelButtonText: 'No, cancelar!',
            confirmButtonClass: 'btn btn-danger',
            cancelButtonClass: 'btn btn-primary',
            buttonsStyling: false,
            animation: false,
            customClass: 'animated tada'
		}).then(function (action) {
            if(action.value) {
                $('#modInvoice').addClass('disabled');
                $('#delInvoice').addClass('disabled');
                $('#sendStatus').addClass('disabled');
                $('#loadingStatus').html('<center><i style="color:#3498db;" class="fa fa-spinner fa-pulse fa-5x fa-fw"></i><span class="sr-only">Loading...</span></center>');
                ajax({url: '/api/deleteInvoice', type: 'POST', data: {invoice: statusDataRow.invoice, business: statusDataRow.business}}).then((data)=>{                
                    chargeModal({id: selectedClient.rut}); // Recargar toda la información del cliente
                    toastr.success(`FACTURA <b>${statusDataRow.invoice}</b> ELIMINADA CORRECTAMENTE`);
                    chargeChart(); // recargar grafico de pantalla principal
                    $('#infoContent').css('display', 'inline');
                    $('#invoiceStep').empty();
                    createLog({form:'Facturas', desc: 'Se eliminó la factura '+statusDataRow.invoice+' del cliente '+selectedClient.rut+' ('+selectedClient.name+')'});                
                });
            }
        }); 
    });

	  $('#invoiceStep').on( 'click', '#sendStatus', function () { 
	  	var invoicePaidDate;
	  	var postData;
	  	var reason;

	  	/* FALTA VALIDAR LENGTH*/
	  	if(statusDataRow.status === 'PAGADO') {
	  		reason = $('#cancellation_reason').val();

	  		if(reason.length === 0) {
	  			reason = 'Sin razón asignada';
	  		}

	  		postData = { invoice: invoiceNumberToChange, reason: reason};

	  	}else if (statusDataRow.status === 'PENDIENTE') {
	  		invoicePaidDate = $('input[name="invoiceDate"]').val();
	  		
	  		if(invoicePaidDate.length === 0) {
	  			invoicePaidDate = moment.tz('America/Santiago').format('DD-MM-YYYY');
	  		}

	  		postData = { invoice: invoiceNumberToChange, date: invoicePaidDate };
	  	}

	  	$('#infoContent').css('visibility', 'visible');
	  	$('#invoiceStep').empty();

      $.ajax({
      	url: 'api/changeInvoiceState',
      	type: 'POST',
      	data: postData
      })
      .done(function(data) {
		getOweds();
      	statusSelectedRow.remove().draw();
      	if(data.status === 'PENDIENTE') {

			createLog2('Facturas', 'Se cambió el estado de la factura '+statusDataRow.invoice+' del cliente '+selectedClient.rut+' ('+selectedClient.name+') de PAGADO a PENDIENTE');

      		invoiceTable.row.add( {
				"invoice": statusDataRow.invoice,
		        "date": statusDataRow.date,
		        "amount": statusDataRow.amount,
		        "description": statusDataRow.description,
		        "business": statusDataRow.business,
		        "status": 'PENDIENTE',
		        "iva": statusDataRow.iva
					}).draw();

      		var filter1 = statusDataRow.amount.replace('$','');
      		var filter2 = filter1.split('.').join('');
      		totalClientPaid -= parseInt(filter2);
					totalClientOwed += parseInt(filter2); 
					totalPaid -= parseInt(filter2);
					totalOwed += parseInt(filter2);
					totalClientPaidCount--;

					chargeClientCharts(totalClientPaidCount, totalClientOwedCount);
					$('#clientPaid').text('$ '+ number_format(totalClientPaid));
					$('#clientOwed').text('$ '+ number_format(totalClientOwed));

					$('#totalOwed').text('$ '+ number_format(totalOwed));

					reloadClientRow(); /////////////////////////////////////////////////////////////////////////////////////////
						
      	}else if (data.status === 'PAGADO') {

      		createLog2('Facturas', 'Se cambió el estado de la factura '+statusDataRow.invoice+' del cliente '+selectedClient.rut+' ('+selectedClient.name+') de PENDIENTE a PAGADO');

      		invoiceTable.row.add( {
						"invoice": statusDataRow.invoice,
		        "date": invoicePaidDate,
		        "amount": statusDataRow.amount,
		        "description": statusDataRow.description,
		        "business": statusDataRow.business,
		        "status": 'PAGADO',
		        "iva": statusDataRow.iva
					}).draw();


      		var filter_1 = statusDataRow.amount.replace('$','');
      		var filter_2 = filter_1.split('.').join(''); 
					totalClientPaid += parseInt(filter_2);
					totalClientOwed -= parseInt(filter_2);
					totalPaid += parseInt(filter_2);
					totalOwed -= parseInt(filter_2);
					//totalClientPaidCount++;
					totalClientOwedCount--;



					chargeClientCharts(totalClientPaidCount, totalClientOwedCount);
					$('#clientPaid').text('$ '+ number_format(totalClientPaid));
					$('#clientOwed').text('$ '+ number_format(totalClientOwed));

					$('#totalOwed').text('$ '+ number_format(totalOwed));



					reloadClientRow(); //////////////////////////////////////////////////////////////////////////					
      	}


      })
      .fail(function() {
      	console.log("error al cambiar estado de factura");
      });
	    
	  });  

};





/*
FINAL DE LA FUNCION GRANDE
*/


const chargeModal = ({id}) => {
    //jQuery.noConflict();
    $('#clientInfo').modal('show');
    $('.nav-pills a[href="#info"]').tab('show'); // ir a pestaña de información del cliente
    $('#invoices').empty();    
    $('#clientData').html('<center><i style="color:#3498db;" class="fa fa-spinner fa-pulse fa-5x fa-fw"></i><span class="sr-only">Loading...</span><br><h3 style="color:#3498db;">Cargando datos del cliente...</h3></center>');
    $('#modal_title').html('<i style="color:#3498db;" class="fa fa-spinner fa-pulse fa-1x fa-fw"></i><span class="sr-only">Loading...</span><br><h3 style="color:#3498db;"></h3>');

    ajax({url:'api/client', type:'POST', data:{rut:id}}).then(data=>{
        var client = data;
        selectedClient = client;
        $('#newInvoiceTabButton').removeClass('disabled'); // activar botón para cargar información con datos de cliente actualizado
        $('#generateReportTabButton').removeClass('disabled'); // activar botón para cargar información con datos de cliente actualizado
        var owedStatus = '';
        if(client.amountOwed === 0) {
            owedStatus = 'SIN DEUDAS'; 
       } else {
            owedStatus = 'PENDIENTE';
       }

        /* Recargar el row de clientsTable siempre que se cargue la pestaña de información del cliente */
        selectedClientRow.remove().draw();
        selectedClientRow = clientsTable.row.add( {
            "name": client.name,
            "rut": $.formatRut(client.rut),
            "invoiceOwed": client.invoiceOwed.reduce((final, actual) => final += actual+' - ','').slice(0, -3),
            "owedStatus": owedStatus,
            "amountOwed": `$ ${number_format(client.amountOwed)}`
        }).draw();
        chargeTotalOweds(); 

        $('#modal_title').text(data.name);        
        $('#clientData').html(`
            <br>		
            <div class="row">
                <div class="col-md-6 col-xs-12 card" style="height:300px;">
                    <center>	<h3>Monto adeudado PENDIENTE</h3> </center>
                    <div style="height: 5px; width:100%; background-color:rgba(231, 76, 60,0.3);"></div>
                    <center> <h2 id="clientOwed"></h2> </center>
                    <br>
                    <center>	<h3>Ganancias totales</h3> </center>
                    <div style="height: 5px; width:100%; background-color:rgba(26, 188, 156,0.3);"></div>
                    <center> <h2 id="clientPaid"></h2> </center>
                </div>

                <div class="col-md-6 col-xs-12 card">
                    <div id="totalClientChart" style="height: 300px; margin: 0 auto"></div>
                </div>
            </div>

            <br>

            <div class="row">
                <div class="col-md-4 col-xs-12 box-shadows">
                    <center>	<h2>Rut</h2> </center>
                    <center> <h1><b> ${$.formatRut(client.rut)} </b></h1> </center>
                </div>
                <div class="col-md-4 col-xs-12 box-shadows">
                    <center>	<h2>dirección</h2> </center>
                    <center> <h3> ${client.address} </h3> </center>
                </div>
                <div class="col-md-4 col-xs-12 box-shadows">
                    <center>	<h2>Correo/s</h2> </center>
                    <ul id="email-list" class="list-group">
                    </ul>
                </div>
            </div>
        `);
    
        $('#email-list').empty();
            
        client.emails.forEach(val => {
            $('#email-list').append('<li class="list-group-item">'+val+'</li>'); 
        });
    
        chargeInvoiceTable(client);
    });
};

const chargeClientsTable = (clientsData) => {
    clientsTable = $('#clientsTable')
    .DataTable({
        "iDisplayLength": 100,
        "dom": 'Bfrtip',
        "buttons": [
            {
                extend: 'pdfHtml5',
                customize: function ( doc ) {
                    doc.content.splice( 1, 0, {
                        margin: [ 0, 0, 0, 12 ],
                        alignment: 'center',
                        image: base64logo
                    } );
                }
            },
		    'excel'
        ],
  	    "oLanguage": {
		    "sSearch": "Buscar "
		},
	    "responsive": true,
        "aaData" : clientsData,
        "columns" : [ 
    	    {"data" : "name"}, 
    	    {"data" : "rut"},
            {"data" : "invoiceOwed"}, 
            {"data" : "owedStatus"}, 
            {"data" : "amountOwed"}
	    ],/*
	    "columnDefs": [
            { className: "toRight", "targets": [1] }
        ],*/
        createdRow: function( row, data, dataIndex){
        if( data.owedStatus == `SIN DEUDAS`){
            $(row).css('background', 'rgba(26, 188, 156,0.3)');
        }else if (data.owedStatus == `PENDIENTE`) {
            $(row).css('background', 'rgba(231, 76, 60,0.3)');
        }
        },
        initComplete: function(settings, json) {
            $('div.dataTables_filter input').focus();
            chargeChart();
        }      
    });
    
	$('#clientsTable tbody').on( 'dblclick', 'tr', function () {
        //$('#infoContent').css('visibility', 'visible');
        $('#infoContent').css('display', 'inline');
		$('#invoiceStep').empty();
        $('.nav-tabs a[href="#info"]').tab('show');
        $('#newInvoiceTabButton').addClass('disabled'); // desactivar botón para evitar cargar información antes de actualizar datos del cliente
        $('#generateReportTabButton').addClass('disabled'); // desactivar botón para evitar cargar información antes de actualizar datos del cliente
        selectedClientRow = clientsTable.row( $(this) );
		// Limpiar de puntos y guion para busqueda de cliente en base de datos (id = rut)
        var rowData = clientsTable.row( $(this) ).data();
        var replace1 = rowData.rut.split('.').join('');
        var replace2 = replace1.replace('-', '');

        //selectedClientRow = datatable.row( $(this) );
        chargeModal({id: replace2});
	});

    // TODO: averiguar para que sirve esto xdd
	clientsTable.on( 'draw', function () { 
        var body = $( clientsTable.table().body() );

        body.unhighlight();
        body.highlight( clientsTable.search() );  
    });

    $('.dataTables_filter input').attr("placeholder", "Buscador");
};

const chargeChart = () => {
    ajax({url:'api/clients/countStatus'}).then(res=>{
        Highcharts.chart('totalChart', {
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type: 'pie'
            },
            title: {
                text: ``
            },
            subtitle: {
                text: `PENDIENTES: ${res.owed} - SIN DEUDAS: ${res.paid}`
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                        style: {
                            color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                        }
                    }
                }
            },
            series: [{
                name: 'porcentaje',
                colorByPoint: true,
                data: [{
                    name: 'SIN DEUDAS',
                    y: res.paid,
                    color: 'rgba(26, 188, 156,0.3)'
                }, {
                    name: 'PENDIENTES',
                    y: res.owed,
                    color: 'rgba(231, 76, 60,0.3)'
                }]
            }]
        }); 
    });
};

function chargeClientCharts({paid, owed}) {
	Highcharts.chart('totalClientChart', {
    chart: {
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
        type: 'pie'
    },
    title: {
        text: `Facturas`
    },
    subtitle: {
        text: `PENDIENTES: ${owed} - PAGADOS: ${paid}`
    },
    tooltip: {
        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
    },
    plotOptions: {
        pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
                enabled: true,
                format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                style: {
                    color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                }
            }
        }
    },
    series: [{
        name: 'porcentaje',
        colorByPoint: true,
        data: [{
            name: 'PAGADO',
            y: paid,
            color: 'rgba(26, 188, 156,0.3)'
        }, {
            name: 'PENDIENTE',
            y: owed,
            color: 'rgba(231, 76, 60,0.3)'
        }]
    }]
	});
}

const chargeTotalOweds = () => { // Cargar adeudado a las empresas de todos los clientes en pantalla principal
    $('#michcomTotalOwed').html('<i style="color:#3498db;" class="fa fa-spinner fa-pulse fa-5x fa-fw"></i><span class="sr-only">Loading...</span>');
    $('#tronitTotalOwed').html('<i style="color:#3498db;" class="fa fa-spinner fa-pulse fa-5x fa-fw"></i><span class="sr-only">Loading...</span>');
    $('#totalOwed').html('<i style="color:#3498db;" class="fa fa-spinner fa-pulse fa-5x fa-fw"></i><span class="sr-only">Loading...</span>');

    ajax({url: 'api/invoiceAmount'}).then(data=>{
        $('#michcomTotalOwed').html(`<h3>$ ${number_format(data.michcom)}</h3>`);
        $('#tronitTotalOwed').html(`<h3>$ ${number_format(data.tronit)}</h3>`);
        $('#totalOwed').html(`<h1>$ ${number_format(data.totalAmount)}</h1>`);
    });
};

/*
    DOCUMENT READY
*/
$(document).ready(() => { 
    $('#loadingClientsTable').append('<center><i style="color:#3498db;" class="fa fa-spinner fa-pulse fa-5x fa-fw"></i><span class="sr-only">Loading...</span><br><h3 style="color:#3498db;">Cargando clientes...</h3></center>');
    chargeTotalOweds();
    formatClients().then(data=>{
        $('#loadingClientsTable').empty();
        chargeClientsTable(data);
    });
});

// EVENTOS
$("a[href='#new']").on('show.bs.tab', function(e) {
    chargeNewInvoiceForm();
});

$("a[href='#generate_report']").on('show.bs.tab', function(e) {
    console.log(selectedClient);
    $('#report_table_invoices').html('<i style="color:#3498db;" class="fa fa-spinner fa-pulse fa-5x fa-fw"></i><span class="sr-only">Loading...</span>');
    $('#initpdf').addClass('disabled');
    getTime().then(res=>{
        let report_date = moment(res).format('dddd DD [de] MMMM [de] YYYY').toUpperCase();
        $('#report_date').text(report_date);
        invoicesReport.date = report_date;
    });

    ajax({url: '/api/invoices/owed', type:'POST', data: {rut:selectedClient.rut}}).then(res=>{
        console.log(res);
        $('#report_table_invoices').empty();
        invoicesReport.rows = [];
        res.forEach(el => {
            invoicesReport.rows.push([el.invoice, el.description, el.business, '$'+number_format(el.amount)]);
            $('#report_table_invoices').append(`
                <tr>
                    <td>${el.invoice}</td>
                    <td>${el.description}</td>
                    <td>${el.business}</td>
                    <td>$ ${number_format(el.amount)}</td>
                </tr>
            `);
        });
        $('#initpdf').removeClass('disabled');
    });

    
    invoicesReport.report_businnes_name = selectedClient.name;
    invoicesReport.report_businnes_rut = $.formatRut(selectedClient.rut);
    invoicesReport.report_businnes_address = selectedClient.address;
    
    $('#report_business_name').text(selectedClient.name);
    $('#report_business_rut').text($.formatRut(selectedClient.rut));
    $('#report_business_address').text(selectedClient.address);
});

$('#new').on('change', '#newInvoiceType', function(){
    if($('#newInvoiceType').val() === 'product') {
        $( "#newInvoiceBusiness" ).val('Michcom Ltda');
    }else if ($('#newInvoiceType').val() === 'service') {
        $( "#newInvoiceBusiness" ).val('Tronit Ltda');
    } 
});

$('#new').on('click', '#sendNewInvoice', function() { // EVENTO CREAR NUEVA FACTURA
	$('#infoContent').css({'display': 'inline'});
	$('#invoiceStep').empty();
	$('#sendNewInvoice').prop('disabled', true); // deshabilitar boton enviar nueva factura

	setTimeout(function(){ // luego de 3 segundos lo habilitamos (en caso de que no se envíe) //TODO: si se demora en enviar se habilita igual (ARREGLAR)
		$('#sendNewInvoice').prop('disabled', false);
	}, 3000);

	$('#form_messages').empty();

	var step = 0; // Pasos de validación formulario nueva factura
	var newInvoiceNumber = parseInt($('#newInvoiceNumber').val()); /*      OBTENER VALORES DE LOS INPUTS NUEVA FACTURA       */
	var newInvoiceAmount = parseInt($('#newInvoiceAmount').val());
	var newInvoiceType = $('#newInvoiceType').val();
	var newInvoiceBusiness = $('#newInvoiceBusiness').val();
	var newInvoiceDescription = $('#newInvoiceDescription').val();
	var iva = parseInt(newInvoiceAmount * 0.19);

	if(newInvoiceType === 'service') {
		iva = 0;
	}
	
    // TODO: PROGRAMAR MENSAJES DE ERROR PARA CADA VALIDACIÓN
	if (newInvoiceNumber > 0 && Number.isInteger(newInvoiceNumber)) { // validar numero factura formulario
		$('#newInvoiceNumber').css('border', '1px solid green');
		step++;
	}else {
		$('#newInvoiceNumber').css('border', '1px solid red');
	}

    if (newInvoiceAmount > 0 && Number.isInteger(newInvoiceAmount)) { // validar precio factura formulario
		$('#newInvoiceAmount').css('border', '1px solid green');
		step++;
	}else {
		$('#newInvoiceAmount').css('border', '1px solid red');
	}

	if (newInvoiceDescription.length >= 5 && newInvoiceDescription.length <= 500) { // validar descripción factura formulario
		$('#newInvoiceDescription').css('border', '1px solid green');
		step++;
	}else {
		$('#newInvoiceDescription').css('border', '1px solid red');
	}

	$('#newInvoiceType').css('border', '1px solid green');
	$('#newInvoiceBusiness').css('border', '1px solid green');

	if(step === 3) {
        let sendData = {
            rut: selectedClient.rut,
            invoice: newInvoiceNumber,
            business: newInvoiceBusiness, 
            amount: newInvoiceAmount, 
            invoice_type: newInvoiceType, 
            description: newInvoiceDescription, 
            date: '-', 
            iva: iva
        };

        ajax({url:'api/invoice', type:'POST', data: sendData}).then(data=>{
			createLog({form:'Facturas', desc:'Se agregó la factura '+newInvoiceNumber+' al cliente '+selectedClient.rut+' ('+selectedClient.name+')'});

			if (data.error) {
				$('#newInvoiceNumber').css('border', '1px solid red');
				$('#form_messages').html('<div class="alert alert-danger"><center>'+data.error+'</center></div>');
				$('#form_messages').slideDown({ opacity: "show" }, "slow");
				$('#sendNewInvoice').prop('disabled', false);
				
			}else if (data.ok) {
				$('#form_messages').html('<div class="alert alert-success"><center>'+data.ok+'</center></div>');
                $('#form_messages').slideDown({ opacity: "show" }, "slow");
                $('.nav-pills a[href="#info"]').tab('show'); // ir a pestaña de información del cliente
                chargeModal({id: selectedClient.rut}); // Recargar toda la información del cliente
                toastr.success(`FACTURA <b>${newInvoiceNumber}</b> CREADA CORRECTAMENTE PARA EL CLIENTE <b>${selectedClient.name}</b>`);
                chargeChart(); // recargar grafico de pantalla principal
                /* REINICIAR FORMULARIO */
                $('#newInvoiceNumber').val('');
                $('#newInvoiceNumber').css('border', '1px solid #CCCCCC');
                $('#newInvoiceAmount').val('');
                $('#newInvoiceAmount').css('border', '1px solid #CCCCCC');
                $('#newInvoiceType').css('border', '1px solid #CCCCCC');
                $('#newInvoiceBusiness').css('border', '1px solid #CCCCCC');
                $('#newInvoiceDescription').val('');
                $('#newInvoiceDescription').css('border', '1px solid #CCCCCC');
                $('#sendNewInvoice').prop('disabled', false);
                $('#form_messages').empty();

			}
        });
	}

});


$('#modal_body').on('click', '#initpdf', () => {
    var columns = ["N° Factura", "Descripción", "Razón social", "Monto"];
    var doc = new jsPDF('p', 'pt');

    doc.setFontSize(12);
    doc.setFontType('bold');
    doc.text(10, 30, invoicesReport.report_businnes_name);
    doc.text(550, 50, invoicesReport.date, null, null, 'right');    
    doc.text(10, 50, invoicesReport.report_businnes_rut);
    doc.text(10, 70, invoicesReport.report_businnes_address);

    doc.setFontSize(10);
    doc.setFontType('normal');
    doc.text(10, 110, 'Estimado cliente:');
    doc.text(10, 130, `Según lo observado en nuestra gestión de cobros, se encuentra pendiente de pagos las facturas según detalle. Las que \n agradecemos cancelar e indicar comprobantes de pago en caso de haber sido canceladas a la fecha.`);
    
    doc.autoTable(columns, invoicesReport.rows, {
        margin: {top:150}
    });

    let finalY = doc.autoTable.previous.finalY+20;

    doc.text(10, finalY, `Recordamos que pueden hacer su pago a través de depósito y/o transferencia bancaria a la siguiente cuenta corriente \n como corresponda.`);
    
    doc.text(10, finalY+40, 'Nombre: ');
    doc.setFontType('bold');
    doc.text(60, finalY+40, 'Asesorias y Servicios Tecnologicos Miguel Esteban Herrera Ureta E.I.R.L.');
    
    doc.setFontType('normal');
    doc.text(10, finalY+60, 'Banco: ');
    doc.setFontType('bold');
    doc.text(60, finalY+60, 'Itaú');

    doc.setFontType('normal');
    doc.text(10, finalY+80, 'Rut: ');
    doc.setFontType('bold');
    doc.text(60, finalY+80, '76.623.477-1');

    doc.setFontType('normal');
    doc.text(10, finalY+100, 'N° Cuenta: ');
    doc.setFontType('bold');
    doc.text(60, finalY+100, '02 07 13 28 23');

    /* OTRA */

    doc.setFontType('normal');
    doc.text(10, finalY+140, 'Nombre: ');
    doc.setFontType('bold');
    doc.text(60, finalY+140, 'Comercial Servicios y Asesorias M y G Limitada');
    
    doc.setFontType('normal');
    doc.text(10, finalY+160, 'Banco: ');
    doc.setFontType('bold');
    doc.text(60, finalY+160, 'Itaú');

    doc.setFontType('normal');
    doc.text(10, finalY+180, 'Rut: ');
    doc.setFontType('bold');
    doc.text(60, finalY+180, '76.235.643-0');

    doc.setFontType('normal');
    doc.text(10, finalY+200, 'N° Cuenta: ');
    doc.setFontType('bold');
    doc.text(60, finalY+200, '02 06 71 15 32');

    doc.setFontType('normal');
    doc.text(10, finalY+240, 'Atentamente.');
    doc.text(10, finalY+250, 'Departamento de Gestión y Cobros.-');
    
    doc.text(270, doc.internal.pageSize.height - 10, 'MICHCOM LTDA');
   
    doc.save(`${invoicesReport.report_businnes_name} ${invoicesReport.date}.pdf`);
});