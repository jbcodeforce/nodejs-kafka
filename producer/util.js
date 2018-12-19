
/**
 * Use the Box-Muller transform generated values from the standard normal distribution to a gaussian
 * distribution with mean mu and standard deviation sigma 
 * @param {*} mu 
 * @param {*} sigma 
 */
function generateGaussianNoise(min,max,skew) {
    const two_pi = 2.0*Math.PI;
    // two random values from normal distribution
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); 
    while(v === 0) v = Math.random();
    var z0 = Math.sqrt( -2.0 * Math.log(u)) * Math.cos(two_pi * v);
    if (z0 > 1 || z0 < 0) return generateGaussianNoise(min,max,skew);
    z0 = Math.pow(z0, skew); // Skew
    z0 *= max - min; // Stretch to fill range
    z0 += min; // offset to min
    return z0;
}

function generateProducts(numberOfProduct) {
    var t = [];
    if(!numberOfProduct) numberOfProduct = 20;
    for (var i = 0; i < numberOfProduct; i++){
        t.push("p_"+i);
    }
    return t;
}

module.exports = {
    generateGaussianNoise,
    generateProducts
};


for (var i=0;i<20;i++) {
    console.log(generateGaussianNoise(1,20,2))
}
