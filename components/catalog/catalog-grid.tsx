'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Zap, Leaf, Droplets } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VerificationType, VerifiedCatalogItem } from '@/lib/types/admin';

export function CatalogGrid() {
  const [items, setItems] = useState<VerifiedCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<VerificationType | ''>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(12);

  useEffect(() => {
    fetchCatalogItems();
  }, [page, type]);

  const fetchCatalogItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (type) params.append('type', type);

      const response = await fetch(`/api/admin/catalog?${params}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching catalog:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: VerificationType) => {
    switch (type) {
      case 'green_carbon':
        return <Leaf className="w-4 h-4" />;
      case 'blue_carbon':
        return <Droplets className="w-4 h-4" />;
      case 'renewable_energy':
        return <Zap className="w-4 h-4" />;
    }
  };

  const getTypeBadgeColor = (type: VerificationType) => {
    const colors: Record<VerificationType, string> = {
      green_carbon: 'bg-emerald-500/10 text-emerald-700',
      blue_carbon: 'bg-cyan-500/10 text-cyan-700',
      renewable_energy: 'bg-yellow-500/10 text-yellow-700',
    };
    return colors[type];
  };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex gap-4 items-end">
        <div className="flex-1 max-w-xs">
          <label className="text-sm font-medium text-foreground mb-2 block">Filter by Type</label>
          <Select value={type} onValueChange={v => { setType(v as VerificationType | ''); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="green_carbon">Green Carbon</SelectItem>
              <SelectItem value="blue_carbon">Blue Carbon</SelectItem>
              <SelectItem value="renewable_energy">Renewable Energy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {total} project{total !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No approved projects in catalog yet</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {/* Image */}
                {item.primary_image_url && (
                  <div className="w-full h-48 bg-muted overflow-hidden">
                    <img
                      src={item.primary_image_url}
                      alt={item.project_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-2">{item.project_name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {item.project_location}
                      </CardDescription>
                    </div>
                    <Badge className={getTypeBadgeColor(item.verification_type)}>
                      {getTypeIcon(item.verification_type)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Description */}
                  {item.project_description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.project_description}</p>
                  )}

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {item.carbon_credits_issued !== null && (
                      <div className="bg-muted/50 p-2 rounded">
                        <p className="text-muted-foreground text-xs">Carbon Credits</p>
                        <p className="font-semibold">{item.carbon_credits_issued?.toFixed(2)}</p>
                      </div>
                    )}

                    {item.energy_generated_mwh !== null && (
                      <div className="bg-muted/50 p-2 rounded">
                        <p className="text-muted-foreground text-xs">Energy Generated</p>
                        <p className="font-semibold">{item.energy_generated_mwh?.toFixed(2)} MWh</p>
                      </div>
                    )}

                    {item.co2_avoided_tonnes !== null && (
                      <div className="bg-muted/50 p-2 rounded">
                        <p className="text-muted-foreground text-xs">CO2 Avoided</p>
                        <p className="font-semibold">{item.co2_avoided_tonnes?.toFixed(2)} tonnes</p>
                      </div>
                    )}
                  </div>

                  {/* Approved Info */}
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    <p>
                      Approved{' '}
                      {item.approved_at && new Date(item.approved_at).toLocaleDateString()}
                    </p>
                  </div>

                  <Button variant="outline" className="w-full">
                    View Project
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-6">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= total}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
