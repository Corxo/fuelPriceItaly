class Preferences{
    type;

    constructor(type){
        this.type = type;
    }

    /**
     * Parse the type and set the corrected one
     * @param string rawType 
     */
    parseType(rawType){
        let acceptTypes = [
            "fuel",
            "flag"
        ];
        let type = rawType.split("_")[0];
        if(!acceptTypes.includes(type))
            throw new Error("Type not handled");
        
        this.type = type;
    }
}

export {
    Preferences
}