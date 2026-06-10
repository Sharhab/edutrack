"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import api from "../../../../../lib/axios";

type ClassRow = {
  name: string;
  level: string;
  capacity: string;
};

export default function BulkClassPage() {
  const [rows, setRows] = useState<ClassRow[]>([
    {
      name: "",
      level: "",
      capacity: "",
    },
  ]);

  const [loading, setLoading] =
    useState(false);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        name: "",
        level: "",
        capacity: "",
      },
    ]);
  };

  const removeRow = (index: number) => {
    setRows((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const updateRow = (
    index: number,
    field: keyof ClassRow,
    value: string
  ) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  };

  const saveAll = async () => {
    try {
      setLoading(true);

      await api.post(
        "/classes/bulk-upsert",
        {
          classes: rows
            .filter(
              (r) => r.name.trim()
            )
            .map((r) => ({
              name: r.name,
              level: r.level,
              capacity: r.capacity
                ? Number(
                    r.capacity
                  )
                : undefined,
            })),
        }
      );

      alert(
        "Classes imported successfully"
      );

      setRows([
        {
          name: "",
          level: "",
          capacity: "",
        },
      ]);
    } catch (error) {
      console.error(error);
      alert(
        "Failed to import classes"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Bulk Class Entry
        </h1>

        <p className="text-slate-400">
          Create multiple classes at once
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="p-4 text-left">
                Class Name
              </th>

              <th className="p-4 text-left">
                Level
              </th>

              <th className="p-4 text-left">
                Capacity
              </th>

              <th className="p-4 w-16"></th>
            </tr>
          </thead>

          <tbody>
            {rows.map(
              (row, index) => (
                <tr
                  key={index}
                  className="border-b border-white/5"
                >
                  <td className="p-3">
                    <input
                      value={
                        row.name
                      }
                      onChange={(e) =>
                        updateRow(
                          index,
                          "name",
                          e.target
                            .value
                        )
                      }
                      className="input"
                    />
                  </td>

                  <td className="p-3">
                    <input
                      value={
                        row.level
                      }
                      onChange={(e) =>
                        updateRow(
                          index,
                          "level",
                          e.target
                            .value
                        )
                      }
                      className="input"
                    />
                  </td>

                  <td className="p-3">
                    <input
                      value={
                        row.capacity
                      }
                      type="number"
                      onChange={(e) =>
                        updateRow(
                          index,
                          "capacity",
                          e.target
                            .value
                        )
                      }
                      className="input"
                    />
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() =>
                        removeRow(
                          index
                        )
                      }
                    >
                      <Trash2
                        size={18}
                      />
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button
          onClick={addRow}
          className="btn-secondary"
        >
          <Plus
            size={16}
            className="mr-2"
          />
          Add Row
        </button>

        <button
          onClick={saveAll}
          disabled={loading}
          className="btn-primary"
        >
          {loading
            ? "Saving..."
            : "Save All Classes"}
        </button>
      </div>
    </div>
  );
}