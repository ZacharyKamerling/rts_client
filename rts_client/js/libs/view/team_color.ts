﻿class TeamColor {
    public red: number;
    public green: number;
    public blue: number;
    

    clone(): TeamColor {
        let tc = new TeamColor();
        tc.red = this.red;
        tc.green = this.green;
        tc.blue = this.blue;

        return tc;
    }
}