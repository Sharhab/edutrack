"use client";

import React from "react";
import { SchoolBranding } from "../../types/report-card";

type Props = {
branding?: SchoolBranding;
};

export default function ReportCardFooter({
branding,
}: Props) {
return ( <div className="mt-6 pt-4 border-t border-gray-300">


  <div className="grid grid-cols-2 gap-12 items-end">

    <div className="text-center relative">

      {branding?.schoolStamp && (
        <img
          src={branding.schoolStamp}
          alt="School Stamp"
          className="absolute right-0 -top-4 h-16 opacity-80 object-contain"
        />
      )}

      {branding?.principalSignature && (
        <img
          src={branding.principalSignature}
          alt="Principal Signature"
          className="h-12 mx-auto object-contain"
        />
      )}

      <div className="border-t border-gray-500 mt-2 pt-1">
        <p className="text-sm font-semibold">
          Principal
        </p>
      </div>

    </div>

    <div className="text-center">

      <div className="h-12" />

      <div className="border-t border-gray-500 mt-2 pt-1">
        <p className="text-sm font-semibold">
          Class Teacher
        </p>
      </div>

    </div>

  </div>

</div>


);
}
