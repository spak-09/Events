import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Layers, Users, Building } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Modal } from '../../../components/ui/modal';
import { Input } from '../../../components/ui/input';
import apiClient from '../../../lib/axios';
import { useUiStore } from '../../../stores/uiStore';

export function VenuesTab({ eventId, event }) {
  const [venue, setVenue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomCapacity, setRoomCapacity] = useState(250);
  const [roomFloor, setRoomFloor] = useState('Level 1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useUiStore();

  const venueId = typeof event?.venue === 'object' ? event?.venue?._id : event?.venue;

  const fetchVenue = async () => {
    if (!venueId) return;
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/venues/${venueId}`);
      setVenue(res.data?.data || null);
    } catch (err) {
      // quiet fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVenue();
  }, [venueId]);

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!roomName || !venueId) return;
    setIsSubmitting(true);
    try {
      await apiClient.post(`/venues/${venueId}/rooms`, {
        name: roomName,
        capacity: Number(roomCapacity),
        floor: roomFloor,
        amenities: ['A/V Display', 'Wi-Fi', 'Microphones'],
      });
      addToast({ title: 'Room Configured', description: `${roomName} added to venue layout.`, type: 'success' });
      setIsModalOpen(false);
      setRoomName('');
      fetchVenue();
    } catch (err) {
      addToast({ title: 'Add Room Failed', description: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const rooms = venue?.rooms || [
    { name: 'Grand Ballroom', capacity: 2500, floor: 'Level 3', amenities: ['Surround Sound', 'LED Wall'] },
    { name: 'Tech Pavilion', capacity: 500, floor: 'Level 1', amenities: ['Booth Power', 'A/V Setup'] },
    { name: 'Breakout Hall A', capacity: 250, floor: 'Level 2', amenities: ['Whiteboards', 'Microphones'] },
    { name: 'Workshop Lab 1', capacity: 100, floor: 'Level 4', amenities: ['LAN Station', 'Dual Screens'] },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold">Venue & Embedded Room Layouts</h3>
          <p className="text-xs text-muted-foreground">
            Capacity boundaries utilized during live conflict checking.
          </p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Add Room
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {rooms.map((room, idx) => (
          <Card key={idx} className="p-5 flex flex-col justify-between shadow-card">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {room.floor || 'Level 1'}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-foreground">{room.capacity}</span>
                </div>
              </div>
              <h4 className="text-sm font-bold text-foreground">{room.name}</h4>
              <div className="flex flex-wrap gap-1 mt-3">
                {room.amenities?.map((amenity, aIdx) => (
                  <span key={aIdx} className="rounded-md bg-muted/60 px-2 py-0.5 text-[9px] text-muted-foreground font-mono">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Room Layout"
        description="Expand the venue floor plan with a new session room."
      >
        <form onSubmit={handleAddRoom} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Room Name</label>
            <Input
              placeholder="e.g. Executive Boardroom B"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Capacity</label>
              <Input
                type="number"
                min="10"
                value={roomCapacity}
                onChange={(e) => setRoomCapacity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Floor / Wing</label>
              <Input
                value={roomFloor}
                onChange={(e) => setRoomFloor(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/50">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Save Room'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
