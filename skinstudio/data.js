class SharedData {

    static createDefaultBones() {
        return [
            {
                "name": "root",
                "pivot": [ 0.0, 0.0, 0.0 ]
            },
            {
                "name": "body",
                "parent": "waist",
                "pivot": [ 0.0, 24.0, 0.0 ]
            },

            {
                "name": "waist",
                "parent": "root",
                "pivot": [ 0.0, 12.0, 0.0 ]
            },

            {
				"name": "belt",
				"parent": "body",
				"pivot": [0, 12, 0]
			},
			
            {
                "name": "head",
                "parent": "body",
                "pivot": [ 0.0, 24.0, 0.0 ]
            },
            

            {
                "name": "cape",
                "pivot": [ 0.0, 24, 3.0 ],
                "rotation":[0,180,0],
                "parent": "body"
            },
            
            {
                "name": "hat",
                "parent": "head",
                "pivot": [ 0.0, 24.0, 0.0 ]
            },
            {
                "name": "helmet",
                "parent": "head",
                "pivot": [ 0.0, 24.0, 0.0 ]
            },

            {
				"name": "helmetArmorOffset",
				"parent": "head",
				"pivot": [0, 24, 0]
			},
			
            {
                "name": "leftArm",
                "parent": "body",
                "pivot": [ -5.0, 22.0, 0.0 ]
            },
            
            {
                "name": "leftSleeve",
                "parent": "leftArm",
                "pivot": [ -5.0, 22.0, 0.0 ]
            },

            {
				"name": "leftArmArmor",
				"parent": "leftArm",
				"pivot": [5, 22, 0],
			},

            {
				"name": "leftArmArmorOffset",
				"parent": "leftArm",
				"pivot": [5, 22, 0]
			},
			
			
            {
                "name": "leftItem",
                "pivot": [ -6.0, 15.0, 1.0 ],
                "parent": "leftArm"
            },
            
            {
                "name": "rightArm",
                "parent": "body",
                "pivot": [ 5.0, 22.0, 0.0 ]
            },

            {
				"name": "rightArmArmor",
				"parent": "rightArm",
				"pivot": [-5, 22, 0],
			},

			{
				"name": "rightArmArmorOffset",
				"parent": "rightArm",
				"pivot": [-5, 22, 0]
			},
			
            {
                "name": "rightSleeve",
                "parent": "rightArm",
                "pivot": [ 5.0, 22.0, 0.0 ]
            },
            {
                "name": "rightItem",
                "pivot": [ 6, 15, 1 ],
                "locators": {
                    "lead_hold": [ -6, 15, 1 ]
                },
                "parent": "rightArm"
            },

            {
                "name": "leftLeg",
                "parent": "root",
                "pivot": [ -1.9, 12.0, 0.0 ]
            },
			
            {
                "name": "leftPants",
                "parent": "leftLeg",
                "pivot": [ -1.9, 12.0, 0.0 ]
            },

            {
				"name": "leftLegging",
				"parent": "leftLeg",
				"pivot": [1.9, 12, 0],
			},

			{
				"name": "leftLegArmorOffset",
				"parent": "leftLeg",
				"pivot": [1.9, 12, 0]
			},
			
			{
				"name": "leftBootArmorOffset",
				"parent": "leftLeg",
				"pivot": [1.9, 12, 0]
			},

            {
                "name": "rightLeg",
                "parent": "root",
                "pivot": [ 1.9, 12.0, 0.0 ]
            },
            {
                "name": "rightPants",
                "parent": "rightLeg",
                "pivot": [ 1.9, 12.0, 0.0 ]
            },

            {
				"name": "rightLegging",
				"parent": "rightLeg",
				"pivot": [-1.9, 12, 0],
			},

			{
				"name": "rightLegArmorOffset",
				"parent": "rightLeg",
				"pivot": [-1.9, 12, 0]
			},
			{
				"name": "rightBootArmorOffset",
				"parent": "rightLeg",
				"pivot": [-1.9, 12, 0]
			},

            {
                "name": "jacket",
                "parent": "body",
                "pivot": [ 0.0, 24.0, 0.0 ]
            },

            {
                "name": "upperbodyparts0",
                "parent": "root",
                "pivot": [ 0.0, 12.0, 0.0 ]
            },
            
            {
                "name": "upperbodyparts1",
                "parent": "root",
                "pivot": [ 0.0, 12.0, 0.0 ]
            },
			
            {
                "name": "upperbodyparts10",
                "parent": "root",
                "pivot": [ 0.0, 12.0, 0.0 ]
            },
			
			{
                "name": "upperbodyparts11",
                "parent": "root",
                "pivot": [ 0.0, 12.0, 0.0 ]
            },

			{
                "name": "upperbodyparts2",
                "parent": "root",
                "pivot": [ 0.0, 12.0, 0.0 ]
            },
			
			{
                "name": "upperbodyparts3",
                "parent": "root",
                "pivot": [ 0.0, 12.0, 0.0 ]
            },
			
			{
                "name": "upperbodyparts4",
                "parent": "root",
                "pivot": [ 0.0, 12.0, 0.0 ]
            },
			
			{
                "name": "upperbodyparts5",
                "parent": "root",
                "pivot": [ 0.0, 12.0, 0.0 ]
            },
			
			{
                "name": "upperbodyparts6",
                "parent": "root",
                "pivot": [ 0.0, 12.0, 0.0 ]
            },
			
			{
                "name": "upperbodyparts7",
                "parent": "root",
                "pivot": [ 0.0, 12.0, 0.0 ]
            },
			
			{
                "name": "upperbodyparts8",
                "parent": "root",
                "pivot": [ 0.0, 12.0, 0.0 ]
            },
			
			{
                "name": "upperbodyparts9",
                "parent": "root",
                "pivot": [ 0.0, 12.0, 0.0 ]
            },
			
			{
                "name": "tentacles_0",
                "parent": "root",
                "pivot": [ 0.0, 12.0, 0.0 ]
            },
			
			{
                "name": "tentacles_1",
                "parent": "root",
                "pivot": [ 0.0, 12.0, 0.0 ]
            },
			
			{
                "name": "tentacles_2",
                "parent": "root",
                "pivot": [ 0.0, 12.0, 0.0 ]
            },
			
			{
                "name": "tentacles_3",
                "parent": "root",
                "pivot": [ 0.0, 12.0, 0.0 ]
            },
			
			{
                "name": "tentacles_4",
                "parent": "root",
                "pivot": [ 0.0, 12.0, 0.0 ]
            },
			
			{
                "name": "tentacles_5",
                "parent": "root",
                "pivot": [ 0.0, 12.0, 0.0 ]
            },
			
			{
                "name": "tentacles_6",
                "parent": "root",
                "pivot": [ 0.0, 12.0, 0.0 ]
            },
			
			{
                "name": "tentacles_7",
                "parent": "root",
                "pivot": [ 0.0, 12.0, 0.0 ]
            },
			
			{
                "name": "tentacles_8",
                "parent": "root",
                "pivot": [ 0.0, 12.0, 0.0 ]
            },
			
			{
                "name": "leg0",
                "parent": "body",
                "pivot": [ -1.9, 12.0, 0.0 ]
            },
            
            {
                "name": "leg1",
                "parent": "body",
                "pivot": [ -1.9, 12.0, 0.0 ]
            },
			
            {
                "name": "leg2",
                "parent": "body",
                "pivot": [ -1.9, 12.0, 0.0 ]
            },
			
            			{
                            "name": "leg3",
                            "parent": "body",
                            "pivot": [ -1.9, 12.0, 0.0 ]
                        },			
			{
                "name": "backlegl",
                "parent": "body",
                "pivot": [ -1.9, 12.0, 0.0 ]
            },
			
			{
                "name": "backlegr",
                "parent": "body",
                "pivot": [ -1.9, 12.0, 0.0 ]
            },
			
			{
                "name": "frontlegl",
                "parent": "body",
                "pivot": [ -1.9, 12.0, 0.0 ]
            },
			
			{
                "name": "frontlegr",
                "parent": "body",
                "pivot": [ -1.9, 12.0, 0.0 ]
            },
			
            {
                "name": "tail",
                "parent": "body",
                "pivot": [ -1.9, 12.0, 0.0 ]
            },
			
			{
                "name": "tai2",
                "parent": "body",
                "pivot": [ -1.9, 12.0, 0.0 ]
            },
			
			{
                "name": "tail_fin",
                "parent": "body",
                "pivot": [ -1.9, 12.0, 0.0 ]
            },
			
            {
            	"name": "lib",
            	"parent": "head",
            	"pivot": [0, 24, 0]
            },

            {
				"name": "leftwing",
				"parent": "body",
				"pivot": [0, 24, 0]
			},
			
            {
				"name": "rightwing",
				"parent": "body",
				"pivot": [0, 24, 0]
			},

			{
				"name": "leftwingtip",
				"parent": "body",
				"pivot": [0, 24, 0]
			},

			{
				"name": "rightwingtip",
				"parent": "body",
				"pivot": [0, 24, 0]
			},
			
			{
				"name": "wing0",
				"parent": "body",
				"pivot": [0, 24, 0]
			},
			
			{
				"name": "wing1",
				"parent": "body",
				"pivot": [0, 24, 0]
			},
			
			{
				"name": "left_wing",
				"parent": "body",
				"pivot": [0, 24, 0]
			},
			
			{
				"name": "right_wing",
				"parent": "body",
				"pivot": [0, 24, 0]
			},
			
			{
				"name": "tailfin",
				"parent": "body",
				"pivot": [0, 24, 0]
			},
			
			{
				"name": "right_fin",
				"parent": "body",
				"pivot": [0, 24, 0]
			},
			
			{
				"name": "left_fin",
				"parent": "body",
				"pivot": [0, 24, 0]
			},
			
			{
				"name": "section_0",
				"parent": "root",
				"pivot": [0, 24, 0]
			},
			
			{
				"name": "section_1",
				"parent": "root",
				"pivot": [0, 24, 0]
			},
			
			{
				"name": "section_2",
				"parent": "root",
				"pivot": [0, 24, 0]
			},
			
			{
				"name": "section_3",
				"parent": "root",
				"pivot": [0, 24, 0]
			},
			
			{
				"name": "base",
				"parent": "body",
				"pivot": [0, 24, 0]
			},
			
			{
				"name": "lower_jaw",
				"parent": "body",
				"pivot": [0, 24, 0]
			},
			
			{
				"name": "upper_jaw",
				"parent": "body",
				"pivot": [0, 24, 0]
			}
			
        ];
    }

}
