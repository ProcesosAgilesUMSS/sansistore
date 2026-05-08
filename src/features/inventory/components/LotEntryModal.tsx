import React, { useState } from 'react';

// Datos de prueba para cumplir con el criterio de búsqueda (CA1)
const mockProducts = [
  { id: '101', name: 'Galletas de Avena Sansi' },
  { id: '102', name: 'Refresco Cola 500ml' },
  { id: '103', name: 'Sándwich Jamón/Queso' },
];

export const LotEntryModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<{id: string, name: string} | null>(null);
  const [quantity, setQuantity] = useState<number | ''>('');

  const filteredProducts = mockProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación de cantidad positiva (CA4)
    if (Number(quantity) <= 0) {
        alert("Error: La cantidad debe ser mayor a 0");
        return;
    }
    if (!selectedProduct) return;

    // Simulación de guardado (CA2 y CA3)
    console.log("Registrando en base de datos:", { 
        productId: selectedProduct.id, 
        quantity: Number(quantity) 
    });
    
    alert(`¡Éxito! Se registraron ${quantity} unidades de ${selectedProduct.name}`);
    
    setSearchTerm('');
    setSelectedProduct(null);
    setQuantity('');
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-(--theme-bg) font-['Outfit'] font-bold text-sm tracking-wide transition-all duration-200 hover:brightness-110 active:scale-95"
      >
        + Nuevo producto
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-200">
            
            <button 
                onClick={() => setIsOpen(false)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 text-2xl"
            >
                &times;
            </button>

            <h2 className="font-['Outfit'] font-black text-2xl text-gray-900 mb-2">Ingreso de Lote</h2>
            <p className="text-gray-500 text-sm mb-6">Busca el producto y registra la nueva cantidad disponible.</p>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Buscador de Productos */}
              <div className="relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Producto</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedProduct(null);
                  }}
                  className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="Escribe ID o Nombre..."
                />
                
                {searchTerm && !selectedProduct && (
                  <ul className="absolute z-10 w-full mt-2 border border-gray-100 rounded-xl max-h-40 overflow-y-auto bg-white shadow-xl">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                        <li 
                            key={product.id} 
                            onClick={() => {
                                setSelectedProduct(product);
                                setSearchTerm(`${product.id} - ${product.name}`);
                            }}
                            className="p-3 hover:bg-gray-50 cursor-pointer text-sm flex justify-between items-center"
                        >
                            <span className="font-medium text-gray-900">{product.name}</span>
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">#{product.id}</span>
                        </li>
                        ))
                    ) : (
                        <li className="p-3 text-sm text-gray-400">No se encontró el producto</li>
                    )}
                  </ul>
                )}
              </div>


              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Cantidad de ingreso</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                  className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="Ej: 50"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl font-['Outfit'] font-bold text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={!selectedProduct || !quantity}
                    className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-['Outfit'] font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 disabled:opacity-50 disabled:shadow-none transition-all"
                >
                    Guardar ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};