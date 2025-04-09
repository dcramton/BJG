async function showhideFedex() {

    // Set the year
    const currentYear = new Date().getFullYear();
    document.getElementById("year").innerHTML = currentYear;

    // Fetch FedEx start date from DynamoDB

    try {
        const response = await fetch('https://yo6lbyfxd1.execute-api.us-east-1.amazonaws.com/prod/dates', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("json response :", data);
        
        // Find the FedEx date in the array
        const fedExDate = data.dates.find(item => item.datename === 'fedEx');
        console.log("fedExDate:", fedExDate);
        if (fedExDate) {
            const fedExStartDate = new Date(fedExDate.date);
            const today = new Date();
            console.log('Today:', today);
            console.log('FedEx start date:', fedExStartDate);
            console.log('Should show FedEx container:', today >= fedExStartDate);  // This should be false
            
            const container = document.getElementById('fedexContainer');
            if (container) {
                console.log('FedEx container found in the DOM.');
                if (today >= fedExStartDate) {
                    console.log('Setting FedEx container display to block.');
                    container.style.display = 'block';
                } else {
                    console.log('Setting FedEx container display to none.');
                    container.style.display = 'none';  // Explicitly hide if before start date
                }
                setTimeout(() => {
                    console.log('Container display style after 100ms:', container.style.display);
                }, 1000);
            } else {
                console.error('FedEx container not found in the DOM.');
            }
        }
        
    } catch (error) {
        console.error('Error fetching FedEx start date:', error);
        // Fallback to default behavior if fetch fails
        const defaultShowDate = new Date('2025-09-15');
        const today = new Date();
        if (today >= defaultShowDate) {
            console.log('Setting FedEx container display to block (default case).');
            document.getElementById('fedexContainer').style.display = 'block';
        }
    }
}

document.addEventListener('DOMContentLoaded', showhideFedex);