export const detectFakeBrand = (url) => {

  try{
    const domain = url
      .replace('https://','')
      .replace('http://','')
      .split('/')[0]
      .toLowerCase();

    const brands = [
      "facebook",
      "instagram",
      "google",
      "paypal",
      "amazon",
      "netflix",
      "bank",
      "paytm",
      "whatsapp"
    ];

    for(let brand of brands){

      if(domain.includes(brand) && !domain.endsWith(".com")){
        return true;
      }

      if(domain.includes("0") || domain.includes("-")){
        return true;
      }
    }

    return false;

  }catch{
    return false;
  }
};