"use client";

import React from "react";
import Image from "next/image";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/Drawer";
import { Button } from "@/components/ui/button";
import { MdInfoOutline } from "react-icons/md";

const InfoDrawer = () => {
    return (
        <Drawer>
            <DrawerTrigger asChild>
                <DrawerClose asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MdInfoOutline size={24} />
                    </Button>
                </DrawerClose>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle style={{ color: "black" }}>Comment fonctionnent les fiches de révision ?</DrawerTitle>
                    <DrawerDescription style={{ color: "black" }}>
                        Voici quelques informations utiles sur le système de fiches :
                    </DrawerDescription>
                </DrawerHeader>
                <div className="p-4 space-y-4" style={{ color: "black" }}>
                    <p>
                        <strong>Points système :</strong>
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>10 points sont gagnés lorsque vous déposez une fiche.</li>
                        <li>5 points sont gagnés pour chaque like reçu sur une fiche.</li>
                    </ul>
                    <p>
                        <strong>Statuts des fiches :</strong>
                    </p>
                    <div className="flex items-center gap-4">
                        <Image src="/badge/Certifiée.svg" alt="Certifiée" width={30} height={30} />
                        <span>Certifiée : Contenu rédigé par un bénévole de l&apos;association Workyt.</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Image src="/badge/Vérifiée.svg" alt="Vérifiée" width={30} height={30} />
                        <span>Vérifiée : Contenu rédigé par un utilisateur de la communauté Workyt, et vérifié par un bénévole. </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Image src="/badge/Non Certifiée.svg" alt="Non Certifiée" width={30} height={30} />
                        <span>Non Certifiée : Contenu rédigé par un utilisateur de la communauté Workyt.</span>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
};

export default InfoDrawer;