type LigneDonnees = Record<string, string>;

type SimpleTableProps = {
  caption: string;
  columns: Array<{ key: string; label: string }>;
  rows: LigneDonnees[];
};

export function SimpleTable({ caption, columns, rows }: SimpleTableProps) {
  return (
    <div className="table-wrapper">
      <table>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((ligne, indexLigne) => (
            <tr key={`${ligne[columns[0].key]}-${indexLigne}`}>
              {columns.map((column) => (
                <td key={column.key}>{ligne[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
