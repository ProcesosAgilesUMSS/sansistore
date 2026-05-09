


import React, { useState } from 'react';

// Mock de productos para buscar
const mockProducts = [
  { id: '101', name: 'Galletas de Avena Sansi' },
  { id: '102', name: 'Refresco Cola 500ml' },
  { id: '103', name: 'Sándwich Jamón/Queso' },
];

export const LotEntryForm: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<{id: string, name: string} | null>(null);
  const [quantity, setQuantity] = useState<number | ''>('');


  const filteredProducts = mockProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación de seguridad extra
    if (Number(quantity) <= 0) {
        alert("Error: La cantidad debe ser mayor a 0");
        return;
    }

    if (!selectedProduct) {
        alert("Por favor selecciona un producto.");
        return;
    }

    // Mock guardado
    console.log("Registrando ingreso en Firebase:", {
        productId: selectedProduct.id,
        quantityToAdd: Number(quantity),
        type: 'entry',
        date: new Date()
    });

    alert(`¡Éxito! Se registraron ${quantity} unidades de ${selectedProduct.name}`);
    
    // Limpiar formulario
    setSearchTerm('');
    setSelectedProduct(null);
    setQuantity('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      
      {/* Búsqueda de Producto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Buscar Producto (por ID o Nombre)
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setSelectedProduct(null);
          }}
          className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Ej: 101 o Galletas..."
        />
        
        {/* Lista de resultados de búsqueda */}
        {searchTerm && !selectedProduct && (
          <ul className="mt-1 border border-gray-200 rounded-md max-h-40 overflow-y-auto bg-white shadow-sm absolute w-full max-w-lg z-10">
            {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                <li 
                    key={product.id} 
                    onClick={() => {
                        setSelectedProduct(product);
                        setSearchTerm(`${product.id} - ${product.name}`);
                    }}
                    className="p-2 hover:bg-blue-50 cursor-pointer text-sm"
                >
                    <span className="font-bold text-gray-500 mr-2">#{product.id}</span>
                    {product.name}
                </li>
                ))
            ) : (
                <li className="p-2 text-sm text-gray-500">No se encontraron productos.</li>
            )}
          </ul>
        )}
      </div>

      {/* Cantidad, impide negativos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cantidad a Ingresar
        </label>
        <input
          type="number"
          min="1" // Impide ingreso de negativos o cero en el HTML
          required
          value={quantity}
          onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
          className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Ej: 50"
        />
      </div>

      {/* Botón de Envío */}
      <button
        type="submit"
        disabled={!selectedProduct || !quantity}
        className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Registrar Ingreso
      </button>
    </form>
  );
};