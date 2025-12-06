import React from 'react';
import { Car, Intersection } from '../types';
import { TruckIcon, Cog6ToothIcon, ArrowsRightLeftIcon, IdentificationIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { MAX_SPEED } from '../constants';

interface VehicleDetailsProps {
  car: Car;
  intersections: Intersection[];
}

const DetailItem: React.FC<{ icon: React.FC<any>, label: string, value: string | number, colorClass?: string }> = ({ icon: Icon, label, value, colorClass = "text-accent" }) => (
  <div className="flex items-start gap-4 p-3 rounded-lg bg-surface">
    <Icon className={`w-5 h-5 mt-1 flex-shrink-0 ${colorClass}`} />
    <div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{label}</div>
      <div className={`font-mono text-sm text-white`}>{value}</div>
    </div>
  </div>
);

export const VehicleDetails: React.FC<VehicleDetailsProps> = ({ car, intersections }) => {
  const getMissionText = () => {
    if (car.type !== 'POLICE' || !car.mission) return 'N/A';
    if (car.mission.type === 'PATROL') return 'Patrolling Grid';
    if (car.mission.type === 'RESPONSE' && car.mission.targetId) {
        const target = intersections.find(i => i.id === car.mission.targetId);
        return `Responding to ${target ? target.label : 'incident'}`;
    }
    return 'Standby';
  };

  const getTargetText = () => {
    const target = intersections.find(i => i.id === car.targetIntersectionId);
    return target ? target.label : 'Leaving Grid';
  };

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
      <div className="flex items-center gap-4 pb-4 border-b border-white/10">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center
          ${car.type === 'POLICE' ? 'bg-blue-500/10 text-blue-400' : 
             car.type === 'BUS' ? 'bg-red-500/10 text-red-400' :
             car.type === 'AUTO' ? 'bg-yellow-500/10 text-yellow-400' :
             'bg-gray-500/10 text-gray-400'
          }`}
        >
            <TruckIcon className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-lg font-tech font-bold text-white uppercase">{car.type} UNIT</h3>
          <p className="font-mono text-xs text-gray-500">{car.id}</p>
        </div>
      </div>

      <div className="space-y-3">
        <DetailItem icon={Cog6ToothIcon} label="State" value={car.isBrokenDown ? 'BROKEN DOWN' : car.state} colorClass={car.isBrokenDown ? 'text-orange-400' : car.state === 'STOPPED' ? 'text-red-400' : 'text-green-400'}/>
        <DetailItem icon={ArrowsRightLeftIcon} label="Speed" value={`${(car.speed / MAX_SPEED * 60).toFixed(0)} km/h`} colorClass="text-cyan-400" />
        <DetailItem icon={MapPinIcon} label="Target Intersection" value={getTargetText()} colorClass="text-purple-400" />
        {car.type === 'POLICE' && (
           <DetailItem icon={IdentificationIcon} label="Mission" value={getMissionText()} colorClass="text-blue-300" />
        )}
      </div>

       <div className="mt-auto p-3 rounded-lg bg-surface text-center">
         <button className="px-4 py-2 text-xs font-bold text-white bg-primary rounded hover:bg-blue-600 transition-colors w-full">
            Issue Directive
         </button>
      </div>
    </div>
  );
};
