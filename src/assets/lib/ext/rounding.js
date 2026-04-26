var roundToDecimal = function (sourceNumber, requiredPrecision) {

    // @sourceNUmber - number
    // @requiredPrecision - number
    // roundedValue  - String

	if (isNaN(sourceNumber)) {
		return sourceNumber
	}

	var ssourceNumber = sourceNumber.toString();
	var intialIntegralValue = ssourceNumber.split(".")[0] - 0; // Sored as sourceNumber
	var intialDecimalValue = ssourceNumber.split(".")[1]; // Stored as String
	var intialDecimalValueLength =  (intialDecimalValue != undefined) ? intialDecimalValue.length : 0;
	
	if (intialDecimalValueLength == requiredPrecision){
		//return the same sourceNumber without rounding if the precision of the sourceNumber is equal to decimal point
		return ssourceNumber;
	
	} else if (intialDecimalValueLength < requiredPrecision){
		//return the same sourceNumber after appending 0 to match the requiredPrecision
		return parseFloat(sourceNumber).toFixed(requiredPrecision);
	
	} else {
		
		//Stripping the symbol of the integral value
		var isNegative = false;
		if(intialIntegralValue < 0){ 
			isNegative = true; 
			intialIntegralValue = 0 - intialIntegralValue ;
		}
		
		if(requiredPrecision == 0){
			intialDecimalValue = "0." + intialDecimalValue - 0;
			intialDecimalValue = Math.round(intialDecimalValue);
			
		}else{

			//intialDecimalValue = intialDecimalValue / Math.pow(10, requiredPrecision);
			
			//Moving the decimal point by precision
			intialDecimalValue = intialDecimalValue.substring(0,requiredPrecision) + "." + intialDecimalValue.substring(requiredPrecision);
			intialDecimalValue = intialDecimalValue - 0;	
			intialDecimalValue = Math.round(intialDecimalValue) + "";
			
			
			if(intialDecimalValue.length > requiredPrecision){
				intialDecimalValue = ( intialDecimalValue - 0 ) / Math.pow(10, requiredPrecision);	// For number like 189.9955 -> Since Decimal part become 100 in this execution
			}else if (intialDecimalValue.length < requiredPrecision){
				intialDecimalValue = "0.0" + intialDecimalValue - 0; // For numbers like 46.065 -> Since Decimal part becomes 7 in this execution
			}else{
				intialDecimalValue = "0." + intialDecimalValue - 0;
			}
		}
		
		roundedValue = (intialIntegralValue + intialDecimalValue);
		roundedValue = (isNegative) ? 0 - roundedValue : roundedValue ;
		roundedValue = roundedValue.toFixed(requiredPrecision);
		return roundedValue;
	
	}
}